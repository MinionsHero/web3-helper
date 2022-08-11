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
