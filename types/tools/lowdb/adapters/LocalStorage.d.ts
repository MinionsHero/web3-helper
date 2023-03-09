import { SyncAdapter } from '../LowSync';
export declare class LocalStorage<T> implements SyncAdapter<T> {
    #private;
    constructor(key: string);
    read(): T | null;
    write(obj: T): void;
}
