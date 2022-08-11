import { Sort } from "./types";
import { AsyncArray } from '../async-array'
import { flatten, last, findLastIndex, concat, get, chunk, cloneDeep } from 'lodash'
import delay from 'delay'

async function _retry<T, U>(el: T, request: (el: T) => Promise<U>, onAttempt?: (e: any, times: number) => PromiseLike<boolean>, times: number = 0, errors: any[] = []): Promise<U> {
    try {
        return await request(el)
    } catch (e) {
        errors.push(e)
        times++
        let continueAttempt = true
        if (times > 5) {
            console.error(e)
        }
        if (onAttempt) {
            continueAttempt = await onAttempt(e, times)
        }
        if (continueAttempt) {
            return await _retry(el, request, onAttempt, times, errors)
        }
        throw errors
    }
}

export async function retry<T, U>(el: T, request: (el: T) => Promise<U>, onAttempt?: (e: any, times: number) => PromiseLike<boolean>): Promise<U> {
    return await _retry(el, request, onAttempt, 0, []);
}

/**
 * Multiple query to boost the query rate.
 */
export async function multiQuery<Query extends { sort?: Sort }, Response, Element = any>(
    args: {
        elments: Element[],
        keys: {
            from: string, // mostly is fromBlock
            to: string, // mostly is endBlock
        },
        breakpoint: (el: Response) => any, // query the last log from/to endpoint
        uniqWith: (a: Response, b: Response) => boolean, // remove the duplicate element of next page
        query: Query, // {fromBlock,endBlock,blockNumber,page,offset}
        request: (el: Element, query: Query, index: number) => PromiseLike<Response[]>,
        prevData: Response[],
        cache?: (data: Response[]) => PromiseLike<void>
    }
): Promise<void> {
    let { elments, keys, query, breakpoint, uniqWith, request, prevData, cache } = args
    const sort = query.sort ? query.sort : Sort.ASC
    const { from, to } = keys
    const lastLog = last(prevData)
    if (lastLog) {
        const rangeValue = breakpoint(lastLog)
        query = { ...query, ...(sort === Sort.ASC ? { [from]: rangeValue } : { [to]: rangeValue }) }
    }
    // multiple query
    const temp = await AsyncArray.fromWithOptions(elments, { concurrency: elments.length }).mapAsync(async (el, i) => {
        return await retry({ el, query, i }, async ({ el, query, i }) => {
            return await request(el, query, i)
        })
    })
    // debugger
    const logs = flatten(temp)
    // remove the duplicate elements
    if (prevData.length > 0) {
        let i = 0
        while (i < logs.length) {
            const log = logs[i]
            const index = findLastIndex(prevData, el => uniqWith(el, log))
            if (index === -1) {
                break
            }
            logs.shift()
            i++
        }
    }
    if (logs.length > 0) {
        // cache the elements 
        if (cache) {
            await cache(logs)
        }
        if (logs.length > 0) {
            args.prevData = concat(prevData, logs).slice(-10000)
            return await multiQuery({ ...args })
        }
    }
}


async function poll<T, U>(chunk: T[], parentIndex: number, feedAmount: number, request: (args: { el: T, index: number }) => Promise<U>, requestDelay: number = 0, _result?: ({ data: U | null } | null)[], _retries?: number[]): Promise<U[]> {
    const result = _result ? _result : new Array<{ data: U | null } | null>(chunk.length).fill(null)
    const retries = _retries ? _retries : new Array<number>(chunk.length).fill(1)
    if (result.length !== chunk.length || retries.length !== chunk.length) {
        throw new Error('result.length should be equal to chunk.')
    }
    if (result.every(el => el !== null)) {
        return result.map(el => (el as { data: U }).data)
    }
    await AsyncArray.fromWithOptions(chunk, { concurrency: feedAmount }).forEachAsync(async (el, i) => {
        if (!result[i]) {
            const data: U = await retry<{ el: T, index: number }, U>({ el, index: parentIndex * chunk.length + i }, request, async (e, times) => {
                retries[i] = times
                if (requestDelay) {
                    await delay(requestDelay)
                }
                return true
            })
            result[i] = { data }
        }
    })
    return await poll(chunk, parentIndex, feedAmount, request, requestDelay, result, retries)
}


export async function sliceTask<T, U>(feedData: T[], chunks: number, request: (args: { el: T, index: number }) => Promise<U>, requestDelay?: number, saveData?: (data: U[], chunk: T[]) => PromiseLike<void>): Promise<U[]> {
    const dataChunks = chunk(feedData, chunks)
    const result: U[][] = await AsyncArray.fromWithOptions(dataChunks, { concurrency: 1 }).mapAsync(async (chunk, i) => {
        const data = await poll<T, U>(chunk, i, chunks, request, requestDelay)
        if (saveData) {
            await saveData(data, chunk)
        }
        return data
    })
    return flatten(result)
}