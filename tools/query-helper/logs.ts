// import bscApiKeys from '../../data/bsc-apikeys'
// import providers from '../../data/providers'
import { FastBscScan, FastScan } from '../../tools/blockscan/fast-scan'
import { GetLogsQuery } from '../blockscan'
import { GetLogsResponse, GetTxReceipt } from '../blockscan/types'

export async function queryLogsAndReceipts(fastScan: FastScan, params: Omit<GetLogsQuery, 'page' | 'offset'>, flags: { fetchLogs: boolean, fetchReceipts: boolean }, filter: (args: { log: GetLogsResponse, receipt: GetTxReceipt }) => boolean, callback: (args: { log: GetLogsResponse, receipt: GetTxReceipt }[]) => void) {
    let isRequestingReceipts = false
    async function receiptsCallback() {
        const logsFt = fastScan.getNativeLogs(params)
        const receiptsFt = fastScan.getNativeTxReceiptsForLogs(params)
        const logsNext = logsFt.read()
        let logsData: GetLogsResponse[] | null
        const receiptsNext = receiptsFt.read()
        let receiptsData: GetTxReceipt[] | null
        const filterData: { log: GetLogsResponse, receipt: GetTxReceipt }[] = []
        while ((logsData = logsNext()) && (receiptsData = receiptsNext())) {
            for (let i = 0; i < receiptsData.length; i++) {
                const log = logsData[i]
                const receipt = receiptsData[i]
                if (log.transactionHash !== receipt.transactionHash) {
                    throw new Error('log transaction do not match the receipt transaction')
                }
                if (filter({ log, receipt })) {
                    filterData.push({ log, receipt })
                }
            }
        }
        if (filterData.length > 0) {
            callback(filterData)
        }
    }
    async function logsCallback() {
        if (!isRequestingReceipts) {
            isRequestingReceipts = true
            if (flags.fetchReceipts) {
                await fastScan.getTxReceiptsForLogs(params, receiptsCallback)
            }
            receiptsCallback()
            isRequestingReceipts = false
        }
    }
    if (flags.fetchLogs) {
        await fastScan.getLogs(params, logsCallback)
    }
    logsCallback()
}