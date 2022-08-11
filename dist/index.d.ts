declare module "tools/fs" {
    export interface Options {
        offset?: number;
    }
    export default class FileTool<T> {
        offset: number;
        filename: string;
        constructor(filename: string, options?: Options);
        private get files();
        get length(): number;
        private get filenames();
        private get lastPageNumber();
        private get firstPageNumber();
        private readFile;
        private writeFile;
        private fileExists;
        readLastPageData(): T[] | null;
        readData(): T[];
        tailData(length: number): T[];
        /**
         * Read form the target position in the array.
         * @param cursor
         * @returns
         */
        read(cursor?: number): () => T[] | null;
        private appendInternal;
        append(data: T[]): void;
    }
}
declare module "tools/export-excel" {
    import { Column } from 'exceljs';
    export type SheetData<T> = {
        title: string;
        summary?: string[];
        columns: (Partial<Column> & {
            type?: string;
        })[];
        records: T[];
        statistics?: Partial<(keyof T)>[];
        headerRows?: any[];
        footerRows?: any[];
        scanUrl?: string;
    };
    export function exportExcel(data: SheetData<any>[], filename?: string): Promise<void>;
}
declare module "tools/blockscan/types" {
    import { JsonFragment } from "@ethersproject/abi";
    export interface HttpClient<T> {
        get: {
            (query: string): Promise<T>;
        };
    }
    export enum Status {
        SUCCESS = "1",
        ERROR = "0"
    }
    export enum Sort {
        ASC = "asc",
        DESC = "desc"
    }
    export enum TokenType {
        ERC20 = "ERC20",
        ERC721 = "ERC721",
        ERC1155 = "ERC1155",
        NONE = "NONE"
    }
    export interface ERC20 {
        symbol: string;
        name: string;
        decimals: number;
    }
    export type BlockNumber = number | 'latest';
    export interface Data<T> {
        status: Status;
        message: "OK" | "NOTOK";
        result: T;
        error?: Error | string;
    }
    export interface GetRequest {
        <T>(query: object): Promise<Data<T>>;
    }
    export interface QueryRequired {
        module: string;
        action: string;
        apiKey: string;
    }
    /**************************************** Account ******************************************/
    export type AccountTokenBalanceQuery = {
        contractaddress?: string;
        tokenname?: string;
        address?: string;
        tag?: BlockNumber;
    };
    export type AccountTokenBalanceResponse = string;
    export type AccountBalanceQuery = {
        tag?: BlockNumber;
        address: string | string[];
    };
    export type AccountBalanceResponse<T = AccountBalanceQuery['address']> = T extends string ? string : {
        account: string;
        balance: string;
    }[];
    export type AccountTxListInternalQueryByAddress = {
        address?: string;
        startblock?: BlockNumber;
        endblock?: BlockNumber;
        page: number;
        offset: number;
        sort?: Sort;
    };
    export type AccountTxListInternalQuery = {
        txhash: string;
    } | AccountTxListInternalQueryByAddress;
    export type AccountTxListInternalResponse = {
        blockNumber: string;
        timeStamp: string;
        hash: string;
        from: string;
        to: string;
        value: string;
        contractAddress: string;
        input: string;
        type: string;
        gas: string;
        gasUsed: string;
        traceId: string;
        isError: string;
        errCode: string;
    };
    export type AccountTxListQuery = {
        address?: string;
        startblock?: BlockNumber;
        endblock?: BlockNumber;
        page: number;
        offset: number;
        sort?: Sort;
    };
    export type AccountTxListResponse = {
        blockNumber: string;
        timeStamp: string;
        hash: string;
        nonce: string;
        blockHash: string;
        transactionIndex: string;
        from: string;
        to: string;
        value: string;
        gas: string;
        gasPrice: string;
        isError: string;
        txreceipt_status: string;
        input: string;
        contractAddress: string;
        cumulativeGasUsed: string;
        gasUsed: string;
        confirmations: string;
        methodId: string;
        functionName: string;
    };
    export type AccountMineBlocksQuery = {
        address: string;
        page: number;
        offset: number;
    };
    export type AccountMineBlocksResponse = {
        blockNumber: string;
        timeStamp: string;
        blockReward: string;
    };
    type TokenTransferEventQuery = {
        contractaddress: string;
        address: string;
    } | {
        contractaddress: string;
    } | {
        address: string;
    };
    export type AccountERC20TokenTransferEventQuery = TokenTransferEventQuery & {
        page: number;
        offset: number;
        startblock?: BlockNumber;
        endblock?: BlockNumber;
        sort?: Sort;
    };
    export type AccountERC20TokenTransferEventResponse = {
        blockNumber: string;
        timeStamp: string;
        hash: string;
        nonce: string;
        blockHash: string;
        from: string;
        contractAddress: string;
        to: string;
        value: string;
        tokenName: string;
        tokenSymbol: string;
        tokenDecimal: string;
        transactionIndex: string;
        gas: string;
        gasPrice: string;
        gasUsed: string;
        cumulativeGasUsed: string;
        input: "deprecated";
        confirmations: string;
    };
    export type AccountERC721TokenTransferEventQuery = TokenTransferEventQuery & {
        page: number;
        offset: number;
        startblock?: BlockNumber;
        endblock?: BlockNumber;
        sort?: Sort;
    };
    export type AccountERC721TokenTransferEventResponse = {
        blockNumber: string;
        timeStamp: string;
        hash: string;
        nonce: string;
        blockHash: string;
        from: string;
        contractAddress: string;
        to: string;
        tokenID: string;
        tokenName: string;
        tokenSymbol: string;
        tokenDecimal: "0";
        transactionIndex: string;
        gas: string;
        gasPrice: string;
        gasUsed: string;
        cumulativeGasUsed: string;
        input: string;
        confirmations: string;
    };
    export type AccountERC1155TokenTransferEventQuery = TokenTransferEventQuery & {
        page: number;
        offset: number;
        startblock?: BlockNumber;
        endblock?: BlockNumber;
        sort?: Sort;
    };
    export type AccountERC1155TokenTransferEventResponse = {
        blockNumber: string;
        timeStamp: string;
        hash: string;
        nonce: string;
        blockHash: string;
        transactionIndex: string;
        gas: string;
        gasPrice: string;
        gasUsed: string;
        cumulativeGasUsed: string;
        input: "deprecated";
        contractAddress: string;
        from: string;
        to: string;
        tokenID: string;
        tokenValue: string;
        tokenName: string;
        tokenSymbol: string;
        confirmations: string;
    };
    export type AccountHistoryBalanceOfEthQuery = {
        address: string;
        blockno: BlockNumber;
    };
    export type AccountHistoryBalanceOfEthResponse = string;
    /**************************************** Block ******************************************/
    export type BlockRewardQuery = {
        blockno: BlockNumber;
    };
    export type BlockRewardResponse = {
        blockNumber: string;
        timeStamp: string;
        blockMiner: string;
        blockReward: string;
        uncles: {
            miner: string;
            unclePosition: string;
            blockreward: string;
        }[];
        uncleInclusionReward: string;
    };
    export type BlockCountdownQuery = {
        blockno: BlockNumber;
    };
    export type BlockCountdownResponse = {
        CurrentBlock: string;
        CountdownBlock: string;
        RemainingBlock: string;
        EstimateTimeInSec: string;
    };
    export type BlockNoByTimestampQuery = {
        timestamp: number;
        closest: 'before' | 'after';
    };
    export type BlockNoByTimestampResponse = string;
    /**************************************** Logs ******************************************/
    export type GetLogsQuery = {
        address?: string;
        fromBlock: BlockNumber;
        toBlock: BlockNumber;
        topic0?: string;
        topic1?: string;
        topic2?: string;
        topic3?: string;
        topic4?: string;
        topic0_1_opr?: 'and' | 'or';
        topic0_2_opr?: 'and' | 'or';
        topic0_3_opr?: 'and' | 'or';
        topic0_4_opr?: 'and' | 'or';
        topic1_2_opr?: 'and' | 'or';
        topic1_3_opr?: 'and' | 'or';
        topic1_4_opr?: 'and' | 'or';
        topic2_3_opr?: 'and' | 'or';
        topic2_4_opr?: 'and' | 'or';
        topic3_4_opr?: 'and' | 'or';
        page: number;
        offset: number;
    };
    export type GetLogsResponse = {
        address: string;
        topics: string[];
        data: string;
        blockNumber: string;
        timeStamp: string;
        gasPrice: string;
        gasUsed: string;
        logIndex: string;
        transactionHash: string;
        transactionIndex: string;
    };
    /**************************************** Logs ******************************************/
    export type TransactionStatusQuery = string;
    export type TransactionStatusResponse = string;
    /**************************************** Contracts ******************************************/
    export type GetContractABIQuery = {
        address: string;
    };
    export type GetContractABIResponse = JsonFragment[];
    export type GetContractSourceCodeQuery = {
        address: string;
    };
    export type GetContractSourceCodeResponse = {
        SourceCode: string;
        ABI: string;
        ContractName: string;
        CompilerVersion: string;
        OptimizationUsed: string;
        Runs: string;
        ConstructorArguments: string;
        EVMVersion: string;
        Library: string;
        LicenseType: string;
        Proxy: "0" | "1";
        Implementation: string;
        SwarmSource: string;
    };
    export type GetTxReceipt = {
        "blockHash": string;
        "blockNumber": string;
        "contractAddress": string | null;
        "cumulativeGasUsed": string;
        "from": string;
        "gasUsed": string;
        "logs": {
            "address": string;
            "topics": string[];
            "data": string;
            "blockNumber": string;
            "transactionHash": string;
            "transactionIndex": string;
            "blockHash": string;
            "logIndex": string;
            "removed": boolean;
        }[];
        "logsBloom": string;
        "status": "0x1" | "0x0";
        "to": string;
        "transactionHash": string;
        "transactionIndex": string;
        "type": string;
    };
}
declare module "tools/blockscan/blockscan" {
    import { AccountTxListInternalResponse, AccountBalanceQuery, AccountBalanceResponse, AccountTokenBalanceQuery, AccountTxListInternalQuery, AccountTxListQuery, AccountMineBlocksQuery, AccountERC20TokenTransferEventQuery, AccountERC721TokenTransferEventQuery, AccountERC1155TokenTransferEventQuery, AccountMineBlocksResponse, AccountERC20TokenTransferEventResponse, AccountERC721TokenTransferEventResponse, AccountERC1155TokenTransferEventResponse, AccountHistoryBalanceOfEthQuery, GetLogsQuery, GetLogsResponse, GetContractABIQuery, GetContractABIResponse, GetContractSourceCodeQuery, GetContractSourceCodeResponse, BlockCountdownQuery, BlockCountdownResponse, BlockNoByTimestampQuery, BlockRewardQuery, BlockRewardResponse, AccountTxListResponse, GetTxReceipt } from "tools/blockscan/types";
    export class BlockScan {
        apiKey: string;
        private baseURL;
        private timeout;
        private httpsAgent;
        constructor(baseURL: string, apiKey: string, timeout?: number, httpsAgent?: any);
        static query(baseURL: string, apiKey: string): BlockScan;
        setApiKey(): void;
        private get;
        /**
         * Returns the amount of Tokens a specific account owns.
         */
        getTokenBalance(query: AccountTokenBalanceQuery): Promise<string>;
        /**
         * Returns the balance of a sepcific account
         */
        getBalanceOfEth<T extends AccountBalanceQuery>({ address, tag }: T): Promise<AccountBalanceResponse<T>>;
        /**
         * Get a list of internal transactions
         */
        getTxListInternal(query: AccountTxListInternalQuery): Promise<AccountTxListInternalResponse[]>;
        /**
         * Get a list of transactions for a specfic address
         */
        getTxList(query: AccountTxListQuery): Promise<AccountTxListResponse[]>;
        /**
         * Get a list of blocks that a specific account has mineds
         */
        getMinedBlocks(query: AccountMineBlocksQuery): Promise<AccountMineBlocksResponse>;
        /**
        * Get a list of "ERC20 - Token Transfer Events" by Address
        */
        getTokenERC20Txs(query: AccountERC20TokenTransferEventQuery): Promise<AccountERC20TokenTransferEventResponse>;
        /**
        * Get a list of "ERC721 - Token Transfer Events" by Address
        */
        getTokenERC721Txs(query: AccountERC721TokenTransferEventQuery): Promise<AccountERC721TokenTransferEventResponse>;
        /**
        * Get a list of "ERC1155 - Token Transfer Events" by Address
        */
        getTokenERC1155Txs(query: AccountERC1155TokenTransferEventQuery): Promise<AccountERC1155TokenTransferEventResponse>;
        /**
         * Gethistorical ether balance for a single address by blockNo.
         */
        getHistoryBalanceOfEth(query: AccountHistoryBalanceOfEthQuery): Promise<string>;
        /**
        * The Event Log API was designed to provide an alternative to the native eth_getLogs.
        */
        getLogs(query: GetLogsQuery): Promise<GetLogsResponse[]>;
        /**
        * Get the ABI
        */
        getContractAbi(query: GetContractABIQuery): Promise<GetContractABIResponse>;
        /**
         * Get the contract source code
         */
        getContractInfo(query: GetContractSourceCodeQuery): Promise<GetContractSourceCodeResponse[]>;
        /**
         * Find the block reward for a given address and block
         */
        getBlockreward(query: BlockRewardQuery): Promise<BlockRewardResponse>;
        /**
         * Find the block countdown for a given address and block
         */
        getBlockCountdown(query: BlockCountdownQuery): Promise<BlockCountdownResponse>;
        /**
         * Find the block no for a given timestamp
         */
        getBlocknoByTime(query: BlockNoByTimestampQuery): Promise<string>;
        getTxReceipt(hash: string): Promise<GetTxReceipt>;
    }
    export class BscScan extends BlockScan {
        constructor(apiKey: string, timeout?: number);
        static query(apiKey: string): BscScan;
    }
}
declare module "tools/async-array/libs/indent-string" {
    export interface Options {
        /**
        The string to use for the indent.
      
        @default ' '
        */
        readonly indent?: string;
        /**
        Also indent empty lines.
      
        @default false
        */
        readonly includeEmptyLines?: boolean;
    }
    export default function indentString(string: string, count?: number, options?: Options): string;
}
declare module "tools/async-array/libs/escape-string-regexp" {
    /**
    Escape RegExp special characters.
    
    You can also use this to escape a string that is inserted into the middle of a regex, for example, into a character class.
    
    @example
    ```
    import escapeStringRegexp from 'escape-string-regexp';
    
    const escapedString = escapeStringRegexp('How much $ for a 🦄?');
    //=> 'How much \\$ for a 🦄\\?'
    
    new RegExp(escapedString);
    ```
    */
    export default function escapeStringRegexp(string: string): string;
}
declare module "tools/async-array/libs/clean-stack" {
    export interface Options {
        /**
        Prettify the file paths in the stack:
    
        `/Users/sindresorhus/dev/clean-stack/unicorn.js:2:15` → `~/dev/clean-stack/unicorn.js:2:15`
    
        @default false
        */
        readonly pretty?: boolean;
        /**
        Remove the given base path from stack trace file paths, effectively turning absolute paths into relative ones.
    
        Example with `'/Users/sindresorhus/dev/clean-stack/'` as `basePath`:
    
        `/Users/sindresorhus/dev/clean-stack/unicorn.js:2:15` → `unicorn.js:2:15`
        */
        readonly basePath?: string;
    }
    /**
    Clean up error stack traces. Removes the mostly unhelpful internal Node.js entries.
    
    @param stack - The `stack` property of an `Error`.
    @returns The cleaned stack or `undefined` if the given `stack` is `undefined`.
    
    @example
    ```
    import cleanStack from 'clean-stack';
    
    const error = new Error('Missing unicorn');
    
    console.log(error.stack);
    
    // Error: Missing unicorn
    //     at Object.<anonymous> (/Users/sindresorhus/dev/clean-stack/unicorn.js:2:15)
    //     at Module._compile (module.js:409:26)
    //     at Object.Module._extensions..js (module.js:416:10)
    //     at Module.load (module.js:343:32)
    //     at Function.Module._load (module.js:300:12)
    //     at Function.Module.runMain (module.js:441:10)
    //     at startup (node.js:139:18)
    
    console.log(cleanStack(error.stack));
    
    // Error: Missing unicorn
    //     at Object.<anonymous> (/Users/sindresorhus/dev/clean-stack/unicorn.js:2:15)
    ```
    */
    export default function cleanStack<T extends string | undefined>(stack: T, options?: Options): string | undefined;
}
declare module "tools/async-array/libs/aggregate-error" {
    /**
    Create an error from multiple errors.
    */
    export default class AggregateError<T extends Error = Error> extends Error {
        readonly name: 'AggregateError';
        _errors: ReadonlyArray<T | Record<string, any> | string>;
        constructor(errors: ReadonlyArray<T | Record<string, any> | string>);
        get errors(): (string | Record<string, any> | T)[];
    }
}
declare module "tools/async-array/libs/p-map" {
    export interface Options {
        /**
        Number of concurrently pending promises returned by `mapper`.
      
        Must be an integer from 1 and up or `Infinity`.
      
        @default Infinity
        */
        readonly concurrency?: number;
        /**
        When `true`, the first mapper rejection will be rejected back to the consumer.
      
        When `false`, instead of stopping when a promise rejects, it will wait for all the promises to settle and then reject with an [aggregated error](https://github.com/sindresorhus/aggregate-error) containing all the errors from the rejected promises.
      
        Caveat: When `true`, any already-started async mappers will continue to run until they resolve or reject. In the case of infinite concurrency with sync iterables, *all* mappers are invoked on startup and will continue after the first rejection. [Issue #51](https://github.com/sindresorhus/p-map/issues/51) can be implemented for abort control.
      
        @default true
        */
        readonly stopOnError?: boolean;
    }
    /**
    Function which is called for every item in `input`. Expected to return a `Promise` or value.
    
    @param element - Iterated element.
    @param index - Index of the element in the source array.
    */
    export type Mapper<Element = any, NewElement = unknown> = (element: Element, index: number) => NewElement | Promise<NewElement>;
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
    export default function pMap<Element, NewElement>(iterable: Iterable<Element | PromiseLike<Element>>, mapper: Mapper<Element, NewElement>, options?: Options): Promise<Array<Exclude<NewElement, typeof pMapSkip>>>;
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
    export const pMapSkip: unique symbol;
}
declare module "tools/async-array/libs/p-filter" {
    import { Options } from "tools/async-array/libs/p-map";
    /**
    Filter promises concurrently.
    
    @param input - Iterated over concurrently in the `filterer` function.
    @param filterer - The filterer function that decides whether an element should be included into result.
    
    @example
    ```
    import pFilter from 'p-filter';
    import getWeather from 'get-weather'; // Not a real module
    
    const places = [
      getCapital('Norway').then(info => info.name),
      'Bangkok, Thailand',
      'Berlin, Germany',
      'Tokyo, Japan',
    ];
    
    const filterer = async place => {
      const weather = await getWeather(place);
      return weather.temperature > 30;
    };
    
    const result = await pFilter(places, filterer);
    
    console.log(result);
    //=> ['Bangkok, Thailand']
    ```
    */
    export default function pFilter<ValueType>(iterable: Iterable<ValueType | PromiseLike<ValueType>>, filterer: (element: ValueType, index: number) => boolean | PromiseLike<boolean>, options?: Options): Promise<ValueType[]>;
}
declare module "tools/async-array/libs/p-every" {
    import { Options } from "tools/async-array/libs/p-map";
    /**
    Test whether *all* promises pass a testing function. Fulfills when *all* promises in `input` and ones returned from `testFunction` are fulfilled, or rejects if any of the promises reject.
    
    @param input - Iterated over concurrently in the `testFunction` function.
    @param testFunction - Predicate function, expected to return a `Promise<boolean>` or `boolean`.
    @returns `true` if all promises passed the test and `false` otherwise.
     */
    export default function pEvery<ValueType>(iterable: Iterable<PromiseLike<ValueType> | ValueType>, testFunction: (element: ValueType, index: number) => boolean | PromiseLike<boolean>, opts?: Options): Promise<boolean>;
}
declare module "tools/async-array/libs/p-one" {
    import { Options } from "tools/async-array/libs/p-map";
    /**
    Test whether *some* promise passes a testing function. Fulfills when *any* promise in `input` and ones returned from `testFunction` are fulfilled, or rejects if any of the promises reject.
    
    @param input - Iterated over concurrently in the `testFunction` function.
    @param testFunction - Predicate function, expected to return a `Promise<boolean>` or `boolean`.
    @returns `true` if any promise passed the test and `false` otherwise.
    */
    export default function pOne<ValueType>(iterable: Iterable<PromiseLike<ValueType> | ValueType>, testFunction: (element: ValueType, index: number) => boolean | Promise<boolean>, options?: Options): Promise<boolean>;
}
declare module "tools/async-array/libs/p-reduce" {
    export type ReducerFunction<ValueType, ReducedValueType = ValueType> = (previousValue: ReducedValueType, currentValue: ValueType, index: number) => PromiseLike<ReducedValueType> | ReducedValueType;
    /**
    Reduce a list of values using promises into a promise for a value.
    
    @param input - Iterated over serially in the `reducer` function.
    @param reducer - Expected to return a value. If a `Promise` is returned, it's awaited before continuing with the next iteration.
    @param initialValue - Value to use as `previousValue` in the first `reducer` invocation.
    @returns A `Promise` that is fulfilled when all promises in `input` and ones returned from `reducer` are fulfilled, or rejects if any of the promises reject. The resolved value is the result of the reduction.
    
    @example
    ```
    import pReduce from 'p-reduce';
    import humanInfo from 'human-info'; // Not a real module
    
    const names = [
      getUser('sindresorhus').then(info => info.name),
      'Addy Osmani',
      'Pascal Hartig',
      'Stephen Sawchuk'
    ];
    
    const totalAge = await pReduce(names, async (total, name) => {
      const info = await humanInfo(name);
      return total + info.age;
    }, 0);
    
    console.log(totalAge);
    //=> 125
    ```
    */
    export default function pReduce<ValueType, ReducedValueType = ValueType>(iterable: Iterable<PromiseLike<ValueType> | ValueType>, reducer: ReducerFunction<ValueType, ReducedValueType>, initialValue?: ReducedValueType): Promise<ReducedValueType>;
}
declare module "tools/async-array/index" {
    export interface Options {
        concurrency: number;
    }
    export class AsyncArray<T> extends Array<T> {
        private options;
        private static defaultOptions;
        constructor(options?: Options);
        static fromWithOptions<T>(iterable: Iterable<T> | ArrayLike<T>, options?: {
            concurrency: number;
        }): AsyncArray<T>;
        static from<T>(iterable: Iterable<T> | ArrayLike<T>): AsyncArray<T>;
        static of<T>(...iterable: Array<T>): AsyncArray<T>;
        mapAsync<U>(callbackfn: (value: T, index: number) => (U | Promise<U>)): Promise<U[]>;
        forEachAsync(callbackfn: (value: T, index: number) => (any | Promise<any>)): Promise<void>;
        filterAsync(callbackfn: (value: T, index: number) => (boolean | Promise<boolean>)): Promise<T[]>;
        everyAsync(callbackfn: (value: T, index: number) => (boolean | Promise<boolean>)): Promise<boolean>;
        someAsync(callbackfn: (value: T, index: number) => (boolean | Promise<boolean>)): Promise<boolean>;
        reduceAsync(callbackfn: (previousValue: T, currentValue: T, currentIndex: number) => (T | Promise<T>)): Promise<T>;
    }
}
declare module "tools/blockscan/helpers" {
    import { Sort } from "tools/blockscan/types";
    export function retry<T, U>(el: T, request: (el: T) => Promise<U>, onAttempt?: (e: any, times: number) => PromiseLike<boolean>): Promise<U>;
    /**
     * Multiple query to boost the query rate.
     */
    export function multiQuery<Query extends {
        sort?: Sort;
    }, Response, Element = any>(args: {
        elments: Element[];
        keys: {
            from: string;
            to: string;
        };
        breakpoint: (el: Response) => any;
        uniqWith: (a: Response, b: Response) => boolean;
        query: Query;
        request: (el: Element, query: Query, index: number) => PromiseLike<Response[]>;
        prevData: Response[];
        cache?: (data: Response[]) => PromiseLike<void>;
    }): Promise<void>;
    export function sliceTask<T, U>(feedData: T[], chunks: number, request: (args: {
        el: T;
        index: number;
    }) => Promise<U>, requestDelay?: number, saveData?: (data: U[], chunk: T[]) => PromiseLike<void>): Promise<U[]>;
}
declare module "tools/blockscan/fast-scan" {
    import FileTool from "tools/fs";
    import { BlockScan } from "tools/blockscan/blockscan";
    import { AccountTxListQuery, AccountTxListResponse, ERC20, GetLogsQuery, GetLogsResponse, GetTxReceipt, TokenType } from "tools/blockscan/types";
    import { ethers } from 'ethers';
    import { JsonFragment } from '@ethersproject/abi';
    export type ContractConfig = {
        address: string;
        sourcecode: string;
        mergedAbi: JsonFragment[];
        abi: JsonFragment[];
        bytecode: string;
        implementation: ContractConfig | null;
        contractName: string;
        constructorArguments: string;
        compilerVersion: string;
        optimizationUsed: string;
        runs: string;
        evmVersion: string;
        library: string;
        licenseType: string;
        proxy: string;
        swarmSource: string;
    };
    export class FastScan {
        private providers;
        private blockScans;
        private output;
        private offset;
        constructor(baseURL: string, apiKeys: string[], providers: ethers.providers.JsonRpcProvider[], output: string);
        dir(args: Record<string, any>): string;
        private _getNativeTxList;
        getNativeTxList(params: Omit<AccountTxListQuery, 'page' | 'offset'>): FileTool<AccountTxListResponse>;
        getNativeTxListDir(params: Omit<AccountTxListQuery, 'page' | 'offset'>): string;
        handleBlockScanError(e: Error): Promise<void>;
        getTxList(params: Omit<AccountTxListQuery, 'page' | 'offset'>): Promise<FileTool<AccountTxListResponse>>;
        private _getNativeLogs;
        getNativeLogsDir(params: Omit<GetLogsQuery, 'page' | 'offset'>): string;
        getNativeLogs(params: Omit<GetLogsQuery, 'page' | 'offset'>): FileTool<GetLogsResponse>;
        getLogs(params: Omit<GetLogsQuery, 'page' | 'offset'>, onDataReceived?: (data: GetLogsResponse[], file: FileTool<GetLogsResponse>) => void): Promise<FileTool<GetLogsResponse>>;
        getNativeTxReceiptsForLogs(params: Omit<GetLogsQuery, 'page' | 'offset'>): FileTool<GetTxReceipt>;
        getNativeTxReceiptsForTxs(params: Omit<AccountTxListQuery, 'page' | 'offset'>): FileTool<GetTxReceipt>;
        private getTxReceiptsForHash;
        getTxReceiptsForLogs(params: Omit<GetLogsQuery, 'page' | 'offset'>, onDataReceived?: (data: GetTxReceipt[], file: FileTool<GetTxReceipt>) => void): Promise<FileTool<GetTxReceipt>>;
        getTxReceiptsForTxs(params: Omit<AccountTxListQuery, 'page' | 'offset'>, onDataReceived?: (data: GetTxReceipt[], file: FileTool<GetTxReceipt>) => void): Promise<FileTool<GetTxReceipt>>;
        writeFile<T>(targetDir: string, filename: string, data: T): T;
        readFile<T>(targetDir: string, filename: string, fill: T): T;
        private parseContract;
        getContract(addr: string, mergedAbi: JsonFragment[], httpConfig: {
            provider: ethers.providers.JsonRpcProvider;
            blockScan: BlockScan;
        }): Promise<ContractConfig | null>;
        requestData<T, U>(data: T[], fn: (el: T, index: number, args: {
            provider: ethers.providers.JsonRpcProvider | null;
            blockScan: BlockScan | null;
        }) => Promise<U>, usage?: {
            provider?: boolean;
            blockScan?: boolean;
        }): Promise<U[]>;
        getContractsInfo(addrs: string[]): Promise<(ContractConfig | null)[]>;
        getTokenType(address: string, { provider, blockScan }: {
            provider: ethers.providers.JsonRpcProvider | null;
            blockScan: BlockScan | null;
        }): any;
        getContractsType(addrs: string[]): Promise<Record<string, TokenType>>;
        getERC20Params(address: string, provider: ethers.providers.JsonRpcProvider): Promise<{
            symbol: any;
            name: any;
            decimals: number;
        }>;
        getERC20ContractsParams(addrs: string[]): Promise<Record<string, ERC20>>;
    }
    export class FastBscScan extends FastScan {
        constructor(apiKeys: string[], providers: ethers.providers.JsonRpcProvider[], output: string);
    }
    export class FastEtherScan extends FastScan {
        constructor(apiKeys: string[], providers: ethers.providers.JsonRpcProvider[], output: string);
    }
    export class FastBTTCScan extends FastScan {
        constructor(apiKeys: string[], providers: ethers.providers.JsonRpcProvider[], output: string);
    }
}
declare module "tools/blockscan/index" {
    export { Data, Status, AccountTxListInternalResponse, AccountBalanceQuery, AccountBalanceResponse, AccountTokenBalanceQuery, AccountTokenBalanceResponse, AccountTxListInternalQuery, AccountTxListQuery, Sort, AccountMineBlocksQuery, AccountERC20TokenTransferEventQuery, AccountERC721TokenTransferEventQuery, AccountERC1155TokenTransferEventQuery, AccountMineBlocksResponse, AccountERC20TokenTransferEventResponse, AccountERC721TokenTransferEventResponse, AccountERC1155TokenTransferEventResponse, AccountHistoryBalanceOfEthQuery, AccountHistoryBalanceOfEthResponse, GetLogsQuery, GetLogsResponse, GetContractABIQuery, GetContractABIResponse, GetContractSourceCodeQuery, GetContractSourceCodeResponse, BlockCountdownQuery, BlockCountdownResponse, BlockNoByTimestampQuery, BlockNoByTimestampResponse, BlockRewardQuery, BlockRewardResponse } from "tools/blockscan/types";
    export { BlockScan, BscScan } from "tools/blockscan/blockscan";
}
declare module "tools/query-helper/logs" {
    import { FastScan } from "tools/blockscan/fast-scan";
    import { GetLogsQuery } from "tools/blockscan/index";
    import { GetLogsResponse, GetTxReceipt } from "tools/blockscan/types";
    export function queryLogsAndReceipts(fastScan: FastScan, params: Omit<GetLogsQuery, 'page' | 'offset'>, flags: {
        fetchLogs: boolean;
        fetchReceipts: boolean;
    }, filter: (args: {
        log: GetLogsResponse;
        receipt: GetTxReceipt;
    }) => boolean, callback: (args: {
        log: GetLogsResponse;
        receipt: GetTxReceipt;
    }[]) => void): Promise<void>;
}
declare module "tools/ethers-extend/utils" {
    export const utils: {
        lowercaseAddress(addr: string): string;
        isSameAddress(addr1: string, addr2: string): boolean;
    };
}
declare module "tools/ethers-extend/index" {
    export { utils } from "tools/ethers-extend/utils";
}
declare module "index" {
    export { default as FileTool } from "tools/fs";
    export { exportExcel } from "tools/export-excel";
    export { queryLogsAndReceipts } from "tools/query-helper/logs";
    export { AsyncArray } from "tools/async-array/index";
    export { utils } from "tools/ethers-extend/index";
    export * from "tools/blockscan/index";
    export { BlockScan, BscScan } from "tools/blockscan/blockscan";
    export { FastScan, FastBTTCScan, FastBscScan, FastEtherScan } from "tools/blockscan/fast-scan";
}
