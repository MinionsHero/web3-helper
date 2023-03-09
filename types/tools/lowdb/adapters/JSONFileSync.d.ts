import { SyncAdapter } from '../LowSync';
export declare class JSONFileSync<T> implements SyncAdapter<T> {
    #private;
    constructor(filename: string);
    read(): T | null;
    write(obj: T): void;
}
