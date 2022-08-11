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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportExcel = void 0;
const exceljs_1 = __importDefault(require("exceljs"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const bignumber_js_1 = __importDefault(require("bignumber.js"));
function getCharFromAlphabetIndex(index) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return alphabet.charAt(index);
}
function getArea(columnStart, columnEnd, rowStart, rowEnd) {
    const startColumnChar = getCharFromAlphabetIndex(columnStart);
    const endColumnChar = getCharFromAlphabetIndex(columnEnd - 1);
    const startRowIndex = rowStart + 1;
    const endRowIndex = rowEnd;
    return `${startColumnChar}${startRowIndex}:${endColumnChar}${endRowIndex}`;
}
function addWorksheet(workbook, data) {
    const { records, title, statistics: _statistics, scanUrl } = data;
    const statistics = _statistics || [];
    const summary = [
        ...(data.summary || [])
    ];
    // summary,head,records
    const rowCount = summary.length + 1 + records.length + (data.headerRows || []).length + (data.footerRows || []).length + (statistics.length > 0 ? 1 : 0);
    // add worksheet
    const worksheet = workbook.addWorksheet(title, {
        views: [{ ySplit: 1 + summary.length, state: 'frozen' }],
        pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, printArea: getArea(0, data.columns.length, 0, rowCount), horizontalCentered: true },
        headerFooter: {
            differentFirst: true,
            differentOddEven: false,
            oddFooter: '第 &P 页，共 &N 页',
            firstHeader: title
        },
    });
    // 写入列名
    worksheet.columns = data.columns.map(el => {
        const item = Object.assign(Object.assign({}, el), { width: el.width ? el.width : el.type === 'transactionHash' ? 66 : el.type === 'address' ? 43 : el.type === 'timeStamp' ? 20 : el.type === 'amount' ? 30 : el.width });
        // if (item.type === 'amount') {
        //   const maxDecimal = BigNumber.max(...data.records.map(record => new BigNumber(record[item.key]).dp())).toNumber()
        //   console.log(`0.${'0'.repeat(maxDecimal)}`)
        //   item.style = { alignment: 'centerContinuous' as Partial<ExcelJS.Alignment>, numFmt: `0.${'0'.repeat(maxDecimal)}` }
        // }
        item.style = Object.assign({}, item.style, { shrinkToFit: true });
        return item;
    });
    let cursor = 0;
    // 写入summary
    for (const info of summary) {
        worksheet.insertRow(cursor, { transactionHash: info }, 'i'); // 根据summary数量添加一些空行
        // 合并summary的单元格
        worksheet.mergeCells(getArea(0, data.columns.length, cursor, cursor + 1));
        worksheet.getCell(`A${cursor + 1}`).value = info;
        cursor++;
    }
    for (const row of data.headerRows || []) {
        worksheet.addRow(row, 'i'); // 添加Header row
        cursor++;
    }
    for (let r of records) {
        let record = {};
        for (let key of Object.keys(r)) {
            const column = data.columns.find(column => column.key === key);
            if (column) {
                switch (column.type) {
                    case 'transactionHash':
                        record[key] = {
                            text: r[key],
                            hyperlink: `${scanUrl}/tx/${r[key]}`,
                            tooltip: `${scanUrl}/tx/${r[key]}`
                        };
                        break;
                    case 'address':
                        record[key] = {
                            text: r[key],
                            hyperlink: `${scanUrl}/address/${r[key]}`,
                            tooltip: `${scanUrl}/address/${r[key]}`
                        };
                        break;
                    case 'link':
                        if (record[key].text && record[key].link) {
                            record[key] = {
                                text: r[key].text,
                                hyperlink: r[key].link,
                                tooltip: r[key].link
                            };
                        }
                        break;
                    case 'amount':
                        record[key] = new bignumber_js_1.default(r[key]).toFixed();
                        break;
                    default:
                        record[key] = r[key];
                        break;
                }
            }
        }
        worksheet.addRow(record);
        cursor++;
    }
    const recordRowEnd = cursor;
    const statisticsRow = {};
    if (statistics.length > 0 && !statistics.find(el => el === data.columns[0].key)) {
        statisticsRow[data.columns[0].key || ''] = '总计';
    }
    for (const key of statistics) {
        const index = data.columns.findIndex(col => col.key === key);
        // statisticsRow[key] = {
        //   formula: `SUM(${getArea(index, index + 1, recordRowStart, recordRowEnd)})`,
        //   result: BigNumber.sum(...records.map(r => new BigNumber((r[key] as any) || 0))).toNumber()
        // }
        statisticsRow[key] = bignumber_js_1.default.sum(...records.map(r => new bignumber_js_1.default(r[key] || 0))).toFixed();
    }
    if (statistics.length > 0) {
        worksheet.addRow(statisticsRow, 'i'); // 添加Footer row
    }
    for (const row of data.footerRows || []) {
        worksheet.addRow(row, 'i'); // 添加Footer row
    }
    return worksheet;
}
function generateWorkbook(data, filename) {
    const workbook = new exceljs_1.default.Workbook(); // setup workbook
    workbook.creator = '';
    workbook.lastModifiedBy = '';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastPrinted = new Date();
    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        addWorksheet(workbook, item);
    }
    return workbook;
}
function exportExcel(data, filename) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!filename) {
            if (data.length !== 1) {
                throw new Error('filename is undefined.');
            }
            filename = data[0].title;
        }
        const dirname = path_1.default.dirname(filename);
        fs_extra_1.default.ensureDirSync(dirname);
        const workbook = generateWorkbook(data, filename);
        workbook.xlsx.writeFile(filename);
    });
}
exports.exportExcel = exportExcel;
