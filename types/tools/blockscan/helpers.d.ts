import { Sort } from "./types";
export declare function retry<T, U>(el: T, request: (el: T) => Promise<U>, onAttempt?: (e: any, times: number) => PromiseLike<boolean>): Promise<U>;
/**
 * Multiple query to boost the query rate.
 */
export declare function multiQuery<Query extends {
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
export declare function sliceTask<T, U>(feedData: T[], chunks: number, request: (args: {
    el: T;
    index: number;
}) => Promise<U>, requestDelay?: number, saveData?: (data: U[], chunk: T[]) => PromiseLike<void>): Promise<U[]>;
