import { SyncAdapter } from '../LowSync';
export declare class MemorySync<T> implements SyncAdapter<T> {
    #private;
    read(): T | null;
    write(obj: T): void;
}
