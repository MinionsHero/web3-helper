"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pMapSkip = void 0;
const aggregate_error_1 = __importDefault(require("./aggregate-error"));
/**
@param input - Synchronous or asynchronous iterable that is iterated over concurrently, calling the `mapper` function for each element. Each iterated item is `await`'d before the `mapper` is invoked so the iterable may return a `Promise` that resolves to an item. Asynchronous iterables (different from synchronous iterables that return `Promise` that resolves to an item) can be used when the next item may not be ready without waiting for an asynchronous process to complete and/or the end of the iterable may be reached after the asynchronous process completes. For example, reading from a remote queue when the queue has reached empty, or reading lines from a stream.
@param mapper - Function which is called for every item in `input`. Expected to return a `Promise` or value.
@returns A `Promise` that is fulfilled when all promises in `input` and ones returned from `mapper` are fulfilled, or rejects if any of the promises reject. The fulfilled value is an `Array` of the fulfilled values returned from `mapper` in `input` order.

@example
```
import pMap from 'p-map';
import got from 'got';

const sites = [
  getWebsiteFromUsername('sindresorhus'), //=> Promise
  'https://avajs.dev',
  'https://github.com'
];

const mapper = async site => {
  const {requestUrl} = await got.head(site);
  return requestUrl;
};

const result = await pMap(sites, mapper, {concurrency: 2});

console.log(result);
//=> ['https://sindresorhus.com/', 'https://avajs.dev/', 'https://github.com/']
```
*/
function pMap(iterable, mapper, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { concurrency, stopOnError } = Object.assign({}, {
            concurrency: Number.POSITIVE_INFINITY,
            stopOnError: true
        }, options);
        return new Promise((resolve, reject_) => {
            if (iterable[Symbol.iterator] === undefined && iterable[Symbol.asyncIterator] === undefined) {
                throw new TypeError(`Expected \`input\` to be either an \`Iterable\` or \`AsyncIterable\`, got (${typeof iterable})`);
            }
            if (typeof mapper !== 'function') {
                throw new TypeError('Mapper function is required');
            }
            if (!((Number.isSafeInteger(concurrency) || concurrency === Number.POSITIVE_INFINITY) && concurrency >= 1)) {
                throw new TypeError(`Expected \`concurrency\` to be an integer from 1 and up or \`Infinity\`, got \`${concurrency}\` (${typeof concurrency})`);
            }
            const result = [];
            const errors = [];
            const skippedIndexesMap = new Map();
            let isRejected = false;
            let isResolved = false;
            let isIterableDone = false;
            let resolvingCount = 0;
            let currentIndex = 0;
            const iterator = iterable[Symbol.iterator] === undefined ? iterable[Symbol.asyncIterator]() : iterable[Symbol.iterator]();
            const reject = reason => {
                isRejected = true;
                isResolved = true;
                reject_(reason);
            };
            const next = () => __awaiter(this, void 0, void 0, function* () {
                if (isResolved) {
                    return;
                }
                const nextItem = yield iterator.next();
                const index = currentIndex;
                currentIndex++;
                // Note: `iterator.next()` can be called many times in parallel.
                // This can cause multiple calls to this `next()` function to
                // receive a `nextItem` with `done === true`.
                // The shutdown logic that rejects/resolves must be protected
                // so it runs only one time as the `skippedIndex` logic is
                // non-idempotent.
                if (nextItem.done) {
                    isIterableDone = true;
                    if (resolvingCount === 0 && !isResolved) {
                        if (!stopOnError && errors.length > 0) {
                            reject(new aggregate_error_1.default(errors));
                            return;
                        }
                        isResolved = true;
                        if (!skippedIndexesMap.size) {
                            resolve(result);
                            return;
                        }
                        const pureResult = [];
                        // Support multiple `pMapSkip`'s.
                        for (const [index, value] of result.entries()) {
                            if (skippedIndexesMap.get(index) === exports.pMapSkip) {
                                continue;
                            }
                            pureResult.push(value);
                        }
                        resolve(pureResult);
                    }
                    return;
                }
                resolvingCount++;
                // Intentionally detached
                (() => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const element = yield nextItem.value;
                        if (isResolved) {
                            return;
                        }
                        const value = yield mapper(element, index);
                        // Use Map to stage the index of the element.
                        // @ts-ignore
                        if (value === exports.pMapSkip) {
                            skippedIndexesMap.set(index, value);
                        }
                        result[index] = value;
                        resolvingCount--;
                        yield next();
                    }
                    catch (e) {
                        const error = e;
                        if (stopOnError) {
                            reject(error);
                        }
                        else {
                            errors.push(error);
                            resolvingCount--;
                            // In that case we can't really continue regardless of `stopOnError` state
                            // since an iterable is likely to continue throwing after it throws once.
                            // If we continue calling `next()` indefinitely we will likely end up
                            // in an infinite loop of failed iteration.
                            try {
                                yield next();
                            }
                            catch (error) {
                                reject(error);
                            }
                        }
                    }
                }))();
            });
            // Create the concurrent runners in a detached (non-awaited)
            // promise. We need this so we can await the `next()` calls
            // to stop creating runners before hitting the concurrency limit
            // if the iterable has already been marked as done.
            // NOTE: We *must* do this for async iterators otherwise we'll spin up
            // infinite `next()` calls by default and never start the event loop.
            (() => __awaiter(this, void 0, void 0, function* () {
                for (let index = 0; index < concurrency; index++) {
                    try {
                        // eslint-disable-next-line no-await-in-loop
                        yield next();
                    }
                    catch (error) {
                        reject(error);
                        break;
                    }
                    if (isIterableDone || isRejected) {
                        break;
                    }
                }
            }))();
        });
    });
}
exports.default = pMap;
/**
Return this value from a `mapper` function to skip including the value in the returned array.

@example
```
import pMap, {pMapSkip} from 'p-map';
import got from 'got';

const sites = [
  getWebsiteFromUsername('sindresorhus'), //=> Promise
  'https://avajs.dev',
  'https://example.invalid',
  'https://github.com'
];

const mapper = async site => {
  try {
    const {requestUrl} = await got.head(site);
    return requestUrl;
  } catch {
    return pMapSkip;
  }
};

const result = await pMap(sites, mapper, {concurrency: 2});

console.log(result);
//=> ['https://sindresorhus.com/', 'https://avajs.dev/', 'https://github.com/']
```
*/
exports.pMapSkip = Symbol('skip');
