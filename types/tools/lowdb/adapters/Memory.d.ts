import { Adapter } from '../Low';
export declare class Memory<T> implements Adapter<T> {
    #private;
    read(): Promise<T | null>;
    write(obj: T): Promise<void>;
}
