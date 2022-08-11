import { Column } from 'exceljs';
export declare type SheetData<T> = {
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
export declare function exportExcel(data: SheetData<any>[], filename?: string): Promise<void>;
