"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryLogsAndReceipts = void 0;
function queryLogsAndReceipts(fastScan, params, flags, filter, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        let isRequestingReceipts = false;
        function receiptsCallback() {
            return __awaiter(this, void 0, void 0, function* () {
                const logsFt = fastScan.getNativeLogs(params);
                const receiptsFt = fastScan.getNativeTxReceiptsForLogs(params);
                const logsNext = logsFt.read();
                let logsData;
                const receiptsNext = receiptsFt.read();
                let receiptsData;
                const filterData = [];
                while ((logsData = logsNext()) && (receiptsData = receiptsNext())) {
                    for (let i = 0; i < receiptsData.length; i++) {
                        const log = logsData[i];
                        const receipt = receiptsData[i];
                        if (log.transactionHash !== receipt.transactionHash) {
                            throw new Error('log transaction do not match the receipt transaction');
                        }
                        if (filter({ log, receipt })) {
                            filterData.push({ log, receipt });
                        }
                    }
                }
                if (filterData.length > 0) {
                    callback(filterData);
                }
            });
        }
        function logsCallback() {
            return __awaiter(this, void 0, void 0, function* () {
                if (!isRequestingReceipts) {
                    isRequestingReceipts = true;
                    if (flags.fetchReceipts) {
                        yield fastScan.getTxReceiptsForLogs(params, receiptsCallback);
                    }
                    receiptsCallback();
                    isRequestingReceipts = false;
                }
            });
        }
        if (flags.fetchLogs) {
            yield fastScan.getLogs(params, logsCallback);
        }
        logsCallback();
    });
}
exports.queryLogsAndReceipts = queryLogsAndReceipts;
