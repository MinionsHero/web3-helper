import { FastScan } from '../../tools/blockscan/fast-scan';
import { GetLogsQuery } from '../blockscan';
import { GetLogsResponse, GetTxReceipt } from '../blockscan/types';
export declare function queryLogsAndReceipts(fastScan: FastScan, params: Omit<GetLogsQuery, 'page' | 'offset'>, flags: {
    fetchLogs: boolean;
    fetchReceipts: boolean;
}, filter: (args: {
    log: GetLogsResponse;
    receipt: GetTxReceipt;
}) => boolean, callback: (args: {
    log: GetLogsResponse;
    receipt: GetTxReceipt;
}[]) => void): Promise<void>;
