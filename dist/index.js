var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
define("tools/fs", ["require", "exports", "fs-extra", "path"], function (require, exports, fs_extra_1, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    fs_extra_1 = __importDefault(fs_extra_1);
    path_1 = __importDefault(path_1);
    class FileTool {
        constructor(filename, options) {
            const o = Object.assign({}, {
                offset: 10000
            }, options);
            this.filename = filename;
            this.offset = o.offset;
        }
        get files() {
            if (fs_extra_1.default.existsSync(this.filename)) {
                const dirFs = fs_extra_1.default.readdirSync(this.filename);
                return dirFs;
            }
            return [];
        }
        get length() {
            let l = 0;
            const next = this.read();
            let data = [];
            while ((data = next())) {
                l += data.length;
            }
            return l;
        }
        get filenames() {
            const files = this.files;
            const filenames = files.map(el => el.replace('.json', '')).map(el => Number(el));
            if (!filenames.every(el => !Number.isNaN(el))) {
                throw new Error('parse error!');
            }
            return filenames;
        }
        get lastPageNumber() {
            const filenames = this.filenames;
            const lastPageNumber = filenames.length > 0 ? Math.max(...filenames) : 0;
            return lastPageNumber;
        }
        get firstPageNumber() {
            const filenames = this.filenames;
            const firstPageNumber = filenames.length > 0 ? Math.min(...filenames) : 0;
            return firstPageNumber;
        }
        readFile(index) {
            const lastPageNumber = this.lastPageNumber;
            if (index === 0 || index > lastPageNumber) {
                return null;
            }
            const filePath = path_1.default.resolve(this.filename, `${index}.json`);
            const data = fs_extra_1.default.readJsonSync(filePath);
            return Array.isArray(data) ? data : [];
        }
        writeFile(i, data) {
            fs_extra_1.default.ensureDirSync(this.filename);
            const filePath = path_1.default.resolve(this.filename, `${i}.json`);
            fs_extra_1.default.writeJsonSync(filePath, data);
        }
        fileExists(i) {
            const filePath = path_1.default.resolve(this.filename, `${i}.json`);
            return fs_extra_1.default.existsSync(filePath);
        }
        readLastPageData() {
            if (this.lastPageNumber) {
                return this.readFile(this.lastPageNumber);
            }
            return null;
        }
        readData() {
            const result = [];
            let data = [];
            const next = this.read();
            while ((data = next())) {
                result.push(...data);
            }
            return result;
        }
        tailData(length) {
            let result = [];
            for (let i = this.lastPageNumber; i > 0; i--) {
                let data = this.readFile(i);
                const restLength = length - result.length;
                if (data) {
                    const r = restLength >= data.length ? data : data.slice(data.length - restLength);
                    result = r.concat(result);
                }
                if (result.length === length) {
                    break;
                }
            }
            return result;
        }
        /**
         * Read form the target position in the array.
         * @param cursor
         * @returns
         */
        read(cursor) {
            const lastPageNumber = this.lastPageNumber;
            const firstPageNumber = this.firstPageNumber;
            let index = firstPageNumber;
            return () => {
                if (index === 0 || index > this.lastPageNumber) {
                    return null;
                }
                if (cursor && cursor > 0) {
                    let sum = 0;
                    let data;
                    while ((data = this.readFile(index))) {
                        sum += data.length;
                        if (sum > cursor) {
                            break;
                        }
                        index++;
                    }
                    const file = this.readFile(index);
                    cursor = 0;
                    index++;
                    return file ? file.slice(cursor - sum) : null;
                }
                const file = this.readFile(index);
                index++;
                return file;
            };
        }
        appendInternal(data) {
            if (data.length === 0) {
                return;
            }
            const lastPageNumber = this.lastPageNumber;
            if (this.fileExists(lastPageNumber)) {
                const originalData = this.readFile(lastPageNumber);
                if (originalData) {
                    if (originalData.length < this.offset) {
                        const diff = this.offset - originalData.length;
                        const slice = Math.min(diff, data.length);
                        this.writeFile(lastPageNumber, originalData.concat(data.splice(0, slice)));
                    }
                    else {
                        this.writeFile(lastPageNumber + 1, data.splice(0, this.offset));
                    }
                }
                else {
                    this.writeFile(lastPageNumber, data.splice(0, this.offset));
                }
            }
            else {
                this.writeFile(1, data.splice(0, this.offset));
            }
            this.appendInternal(data);
        }
        append(data) {
            return this.appendInternal([...data]);
        }
    }
    exports.default = FileTool;
});
define("tools/export-excel", ["require", "exports", "exceljs", "path", "fs-extra", "bignumber.js"], function (require, exports, exceljs_1, path_2, fs_extra_2, bignumber_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.exportExcel = void 0;
    exceljs_1 = __importDefault(exceljs_1);
    path_2 = __importDefault(path_2);
    fs_extra_2 = __importDefault(fs_extra_2);
    bignumber_js_1 = __importDefault(bignumber_js_1);
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
            const dirname = path_2.default.dirname(filename);
            fs_extra_2.default.ensureDirSync(dirname);
            const workbook = generateWorkbook(data, filename);
            workbook.xlsx.writeFile(filename);
        });
    }
    exports.exportExcel = exportExcel;
});
define("tools/blockscan/types", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TokenType = exports.Sort = exports.Status = void 0;
    var Status;
    (function (Status) {
        Status["SUCCESS"] = "1";
        Status["ERROR"] = "0";
    })(Status = exports.Status || (exports.Status = {}));
    var Sort;
    (function (Sort) {
        Sort["ASC"] = "asc";
        Sort["DESC"] = "desc";
    })(Sort = exports.Sort || (exports.Sort = {}));
    var TokenType;
    (function (TokenType) {
        TokenType["ERC20"] = "ERC20";
        TokenType["ERC721"] = "ERC721";
        TokenType["ERC1155"] = "ERC1155";
        TokenType["NONE"] = "NONE";
    })(TokenType = exports.TokenType || (exports.TokenType = {}));
});
define("tools/blockscan/blockscan", ["require", "exports", "axios", "qs", "tools/blockscan/types"], function (require, exports, axios_1, qs_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BscScan = exports.BlockScan = void 0;
    axios_1 = __importDefault(axios_1);
    qs_1 = __importDefault(qs_1);
    var Module;
    (function (Module) {
        Module["Account"] = "account";
        Module["Contract"] = "contract";
        Module["Block"] = "block";
        Module["Logs"] = "logs";
        Module["Proxy"] = "proxy";
    })(Module || (Module = {}));
    class BlockScan {
        constructor(baseURL, apiKey, timeout = 10000, httpsAgent) {
            this.apiKey = apiKey;
            this.baseURL = baseURL;
            this.timeout = timeout;
            this.httpsAgent = httpsAgent;
        }
        // private static availableInstances: BlockScan[] = []
        // public static initAvailableApiKeys(baseURL: string, keys: string[], timeout: number = 10000) {
        //     this.availableInstances = keys.map(key => new BlockScan(baseURL, key, timeout))
        // }
        // public static getAvailable() {
        //     const key = this.availableApiKeys.unshift()
        // }
        static query(baseURL, apiKey) {
            return new BlockScan(baseURL, apiKey);
        }
        setApiKey() {
            this.apiKey = this.apiKey;
        }
        get(module, query) {
            return __awaiter(this, void 0, void 0, function* () {
                const url = this.baseURL + '/api?' + qs_1.default.stringify(Object.assign({ apiKey: this.apiKey, module }, query));
                console.log(url);
                try {
                    const response = yield axios_1.default.get(url, {
                        responseType: 'json',
                        httpsAgent: this.httpsAgent
                    });
                    var data = response.data;
                    if (data.status && data.status !== types_1.Status.SUCCESS) {
                        let returnMessage = data.message || 'NOTOK';
                        if (returnMessage === 'No transactions found' || returnMessage === 'No records found') {
                            return data.result;
                        }
                        if (data.result && typeof data.result === 'string') {
                            returnMessage = data.result;
                        }
                        else if (data.message && typeof data.message === 'string') {
                            returnMessage = data.message;
                        }
                        console.error(returnMessage);
                        throw new Error(returnMessage);
                    }
                    if (data.error) {
                        let message = data.error;
                        if (typeof data.error === 'object' && data.error.message) {
                            message = data.error.message;
                        }
                        console.error(message);
                        throw message;
                    }
                    return data.result;
                }
                catch (e) {
                    debugger;
                    throw e;
                }
            });
        }
        /**
         * Returns the amount of Tokens a specific account owns.
         */
        getTokenBalance(query) {
            return this.get(Module.Account, Object.assign({
                action: 'tokenbalance',
                tag: 'latest',
            }, query));
        }
        /**
         * Returns the balance of a sepcific account
         */
        getBalanceOfEth({ address, tag }) {
            let action = 'balance';
            if (typeof address !== 'string' && address && address.length) {
                address = address.join(',');
                action = 'balancemulti';
            }
            return this.get(Module.Account, Object.assign({
                action,
                address,
                tag: 'latest'
            }, { tag }));
        }
        /**
         * Get a list of internal transactions
         */
        getTxListInternal(query) {
            return this.get(Module.Account, Object.assign({
                action: 'txlistinternal',
                startblock: 0,
                endblock: 'latest',
                sort: types_1.Sort.ASC
            }, query));
        }
        /**
         * Get a list of transactions for a specfic address
         */
        getTxList(query) {
            return this.get(Module.Account, Object.assign({
                action: 'txlist',
                startblock: 0,
                endblock: 'latest',
                sort: types_1.Sort.ASC
            }, query));
        }
        /**
         * Get a list of blocks that a specific account has mineds
         */
        getMinedBlocks(query) {
            return this.get(Module.Account, Object.assign({
                action: 'getminedblocks',
                blocktype: 'blocks',
            }, query));
        }
        /**
        * Get a list of "ERC20 - Token Transfer Events" by Address
        */
        getTokenERC20Txs(query) {
            return this.get(Module.Account, Object.assign({
                action: 'tokentx',
                startblock: 0,
                endblock: 'latest',
                sort: types_1.Sort.ASC
            }, query));
        }
        /**
        * Get a list of "ERC721 - Token Transfer Events" by Address
        */
        getTokenERC721Txs(query) {
            return this.get(Module.Account, Object.assign({
                action: 'tokennfttx',
                startblock: 0,
                endblock: 'latest',
                sort: types_1.Sort.ASC
            }, query));
        }
        /**
        * Get a list of "ERC1155 - Token Transfer Events" by Address
        */
        getTokenERC1155Txs(query) {
            return this.get(Module.Account, Object.assign({
                action: 'tokennfttx',
                startblock: 0,
                endblock: 'latest',
                sort: types_1.Sort.ASC
            }, query));
        }
        /**
         * Gethistorical ether balance for a single address by blockNo.
         */
        getHistoryBalanceOfEth(query) {
            return this.get(Module.Account, Object.assign({
                action: 'balancehistory'
            }, query));
        }
        /**
        * The Event Log API was designed to provide an alternative to the native eth_getLogs.
        */
        getLogs(query) {
            return this.get(Module.Logs, Object.assign({
                action: 'getLogs',
                fromBlock: 0,
                toBlock: 'latest',
            }, query));
        }
        /**
        * Get the ABI
        */
        getContractAbi(query) {
            return this.get(Module.Contract, Object.assign({
                action: 'getabi',
            }, query));
        }
        /**
         * Get the contract source code
         */
        getContractInfo(query) {
            return this.get(Module.Contract, Object.assign({
                action: 'getsourcecode',
            }, query));
        }
        /**
         * Find the block reward for a given address and block
         */
        getBlockreward(query) {
            return this.get(Module.Block, Object.assign({
                action: 'getblockreward',
            }, query));
        }
        /**
         * Find the block countdown for a given address and block
         */
        getBlockCountdown(query) {
            return this.get(Module.Block, Object.assign({
                action: 'getblockcountdown',
            }, query));
        }
        /**
         * Find the block no for a given timestamp
         */
        getBlocknoByTime(query) {
            return this.get(Module.Block, Object.assign({
                action: 'getblocknobytime',
            }, query));
        }
        getTxReceipt(hash) {
            return this.get(Module.Proxy, Object.assign({
                action: 'eth_getTransactionReceipt',
                txhash: hash
            }));
        }
    }
    exports.BlockScan = BlockScan;
    class BscScan extends BlockScan {
        constructor(apiKey, timeout = 10000) {
            super('https://api.bscscan.com', apiKey, timeout);
        }
        static query(apiKey) {
            return new BscScan(apiKey);
        }
    }
    exports.BscScan = BscScan;
});
define("tools/async-array/libs/indent-string", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function indentString(string, count = 1, options) {
        const { indent, includeEmptyLines } = Object.assign({}, {
            indent: ' ',
            includeEmptyLines: false
        }, options);
        if (typeof string !== 'string') {
            throw new TypeError(`Expected \`input\` to be a \`string\`, got \`${typeof string}\``);
        }
        if (typeof count !== 'number') {
            throw new TypeError(`Expected \`count\` to be a \`number\`, got \`${typeof count}\``);
        }
        if (count < 0) {
            throw new RangeError(`Expected \`count\` to be at least 0, got \`${count}\``);
        }
        if (typeof indent !== 'string') {
            throw new TypeError(`Expected \`options.indent\` to be a \`string\`, got \`${typeof indent}\``);
        }
        if (count === 0) {
            return string;
        }
        const regex = includeEmptyLines ? /^/gm : /^(?!\s*$)/gm;
        return string.replace(regex, indent.repeat(count));
    }
    exports.default = indentString;
});
define("tools/async-array/libs/escape-string-regexp", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
    Escape RegExp special characters.
    
    You can also use this to escape a string that is inserted into the middle of a regex, for example, into a character class.
    
    @example
    ```
    import escapeStringRegexp from 'escape-string-regexp';
    
    const escapedString = escapeStringRegexp('How much $ for a 🦄?');
    //=> 'How much \\$ for a 🦄\\?'
    
    new RegExp(escapedString);
    ```
    */
    function escapeStringRegexp(string) {
        if (typeof string !== 'string') {
            throw new TypeError('Expected a string');
        }
        // Escape characters with special meaning either inside or outside character sets.
        // Use a simple backslash escape when it’s always valid, and a `\xnn` escape when the simpler form would be disallowed by Unicode patterns’ stricter grammar.
        return string
            .replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
            .replace(/-/g, '\\x2d');
    }
    exports.default = escapeStringRegexp;
});
define("tools/async-array/libs/clean-stack", ["require", "exports", "os", "tools/async-array/libs/escape-string-regexp"], function (require, exports, os_1, escape_string_regexp_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    os_1 = __importDefault(os_1);
    escape_string_regexp_1 = __importDefault(escape_string_regexp_1);
    const extractPathRegex = /\s+at.*[(\s](.*)\)?/;
    const pathRegex = /^(?:(?:(?:node|node:[\w/]+|(?:(?:node:)?internal\/[\w/]*|.*node_modules\/(?:babel-polyfill|pirates)\/.*)?\w+)(?:\.js)?:\d+:\d+)|native)/;
    const homeDir = typeof os_1.default.homedir === 'undefined' ? '' : os_1.default.homedir().replace(/\\/g, '/');
    /**
    Clean up error stack traces. Removes the mostly unhelpful internal Node.js entries.
    
    @param stack - The `stack` property of an `Error`.
    @returns The cleaned stack or `undefined` if the given `stack` is `undefined`.
    
    @example
    ```
    import cleanStack from 'clean-stack';
    
    const error = new Error('Missing unicorn');
    
    console.log(error.stack);
    
    // Error: Missing unicorn
    //     at Object.<anonymous> (/Users/sindresorhus/dev/clean-stack/unicorn.js:2:15)
    //     at Module._compile (module.js:409:26)
    //     at Object.Module._extensions..js (module.js:416:10)
    //     at Module.load (module.js:343:32)
    //     at Function.Module._load (module.js:300:12)
    //     at Function.Module.runMain (module.js:441:10)
    //     at startup (node.js:139:18)
    
    console.log(cleanStack(error.stack));
    
    // Error: Missing unicorn
    //     at Object.<anonymous> (/Users/sindresorhus/dev/clean-stack/unicorn.js:2:15)
    ```
    */
    function cleanStack(stack, options) {
        const { pretty = false, basePath } = Object.assign({}, options);
        const basePathRegex = basePath && new RegExp(`(at | \\()${(0, escape_string_regexp_1.default)(basePath.replace(/\\/g, '/'))}`, 'g');
        if (typeof stack !== 'string') {
            return undefined;
        }
        return stack.replace(/\\/g, '/')
            .split('\n')
            .filter(line => {
            const pathMatches = line.match(extractPathRegex);
            if (pathMatches === null || !pathMatches[1]) {
                return true;
            }
            const match = pathMatches[1];
            // Electron
            if (match.includes('.app/Contents/Resources/electron.asar') ||
                match.includes('.app/Contents/Resources/default_app.asar')) {
                return false;
            }
            return !pathRegex.test(match);
        })
            .filter(line => line.trim() !== '')
            .map(line => {
            if (basePathRegex) {
                line = line.replace(basePathRegex, '$1');
            }
            if (pretty) {
                line = line.replace(extractPathRegex, (m, p1) => m.replace(p1, p1.replace(homeDir, '~')));
            }
            return line;
        })
            .join('\n');
    }
    exports.default = cleanStack;
});
define("tools/async-array/libs/aggregate-error", ["require", "exports", "tools/async-array/libs/indent-string", "tools/async-array/libs/clean-stack"], function (require, exports, indent_string_1, clean_stack_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    indent_string_1 = __importDefault(indent_string_1);
    clean_stack_1 = __importDefault(clean_stack_1);
    const cleanInternalStack = stack => stack.replace(/\s+at .*aggregate-error\/index.js:\d+:\d+\)?/g, '');
    /**
    Create an error from multiple errors.
    */
    class AggregateError extends Error {
        constructor(errors) {
            super();
            this.name = 'AggregateError';
            if (!Array.isArray(errors)) {
                throw new TypeError(`Expected input to be an Array, got ${typeof errors}`);
            }
            errors = errors.map(error => {
                if (error instanceof Error) {
                    return error;
                }
                if (error !== null && typeof error === 'object') {
                    // Handle plain error objects with message property and/or possibly other metadata
                    return Object.assign(new Error(error.message), error);
                }
                return new Error(error);
            });
            let message = errors
                .map(error => {
                // The `stack` property is not standardized, so we can't assume it exists
                // @ts-ignore
                return typeof error.stack === 'string' ? cleanInternalStack((0, clean_stack_1.default)(error.stack)) : String(error);
            })
                .join('\n');
            message = '\n' + (0, indent_string_1.default)(message, 4);
            super(message);
            this._errors = errors;
        }
        get errors() {
            return this._errors.slice();
        }
    }
    exports.default = AggregateError;
});
define("tools/async-array/libs/p-map", ["require", "exports", "tools/async-array/libs/aggregate-error"], function (require, exports, aggregate_error_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.pMapSkip = void 0;
    aggregate_error_1 = __importDefault(aggregate_error_1);
    /**
    @param input - Synchronous or asynchronous iterable that is iterated over concurrently, calling the `mapper` function for each element. Each iterated item is `await`'d before the `mapper` is invoked so the iterable may return a `Promise` that resolves to an item. Asynchronous iterables (different from synchronous iterables that return `Promise` that resolves to an item) can be used when the next item may not be ready without waiting for an asynchronous process to complete and/or the end of the iterable may be reached after the asynchronous process completes. For example, reading from a remote queue when the queue has reached empty, or reading lines from a stream.
    @param mapper - Function which is called for every item in `input`. Expected to return a `Promise` or value.
    @returns A `Promise` that is fulfilled when all promises in `input` and ones returned from `mapper` are fulfilled, or rejects if any of the promises reject. The fulfilled value is an `Array` of the fulfilled values returned from `mapper` in `input` order.
    
    @example
    ```
    import pMap from 'p-map';
    import got from 'got';
    
    const sites = [
      getWebsiteFromUsername('sindresorhus'), //=> Promise
      'https://avajs.dev',
      'https://github.com'
    ];
    
    const mapper = async site => {
      const {requestUrl} = await got.head(site);
      return requestUrl;
    };
    
    const result = await pMap(sites, mapper, {concurrency: 2});
    
    console.log(result);
    //=> ['https://sindresorhus.com/', 'https://avajs.dev/', 'https://github.com/']
    ```
    */
    function pMap(iterable, mapper, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { concurrency, stopOnError } = Object.assign({}, {
                concurrency: Number.POSITIVE_INFINITY,
                stopOnError: true
            }, options);
            return new Promise((resolve, reject_) => {
                if (iterable[Symbol.iterator] === undefined && iterable[Symbol.asyncIterator] === undefined) {
                    throw new TypeError(`Expected \`input\` to be either an \`Iterable\` or \`AsyncIterable\`, got (${typeof iterable})`);
                }
                if (typeof mapper !== 'function') {
                    throw new TypeError('Mapper function is required');
                }
                if (!((Number.isSafeInteger(concurrency) || concurrency === Number.POSITIVE_INFINITY) && concurrency >= 1)) {
                    throw new TypeError(`Expected \`concurrency\` to be an integer from 1 and up or \`Infinity\`, got \`${concurrency}\` (${typeof concurrency})`);
                }
                const result = [];
                const errors = [];
                const skippedIndexesMap = new Map();
                let isRejected = false;
                let isResolved = false;
                let isIterableDone = false;
                let resolvingCount = 0;
                let currentIndex = 0;
                const iterator = iterable[Symbol.iterator] === undefined ? iterable[Symbol.asyncIterator]() : iterable[Symbol.iterator]();
                const reject = reason => {
                    isRejected = true;
                    isResolved = true;
                    reject_(reason);
                };
                const next = () => __awaiter(this, void 0, void 0, function* () {
                    if (isResolved) {
                        return;
                    }
                    const nextItem = yield iterator.next();
                    const index = currentIndex;
                    currentIndex++;
                    // Note: `iterator.next()` can be called many times in parallel.
                    // This can cause multiple calls to this `next()` function to
                    // receive a `nextItem` with `done === true`.
                    // The shutdown logic that rejects/resolves must be protected
                    // so it runs only one time as the `skippedIndex` logic is
                    // non-idempotent.
                    if (nextItem.done) {
                        isIterableDone = true;
                        if (resolvingCount === 0 && !isResolved) {
                            if (!stopOnError && errors.length > 0) {
                                reject(new aggregate_error_1.default(errors));
                                return;
                            }
                            isResolved = true;
                            if (!skippedIndexesMap.size) {
                                resolve(result);
                                return;
                            }
                            const pureResult = [];
                            // Support multiple `pMapSkip`'s.
                            for (const [index, value] of result.entries()) {
                                if (skippedIndexesMap.get(index) === exports.pMapSkip) {
                                    continue;
                                }
                                pureResult.push(value);
                            }
                            resolve(pureResult);
                        }
                        return;
                    }
                    resolvingCount++;
                    // Intentionally detached
                    (() => __awaiter(this, void 0, void 0, function* () {
                        try {
                            const element = yield nextItem.value;
                            if (isResolved) {
                                return;
                            }
                            const value = yield mapper(element, index);
                            // Use Map to stage the index of the element.
                            // @ts-ignore
                            if (value === exports.pMapSkip) {
                                skippedIndexesMap.set(index, value);
                            }
                            result[index] = value;
                            resolvingCount--;
                            yield next();
                        }
                        catch (e) {
                            const error = e;
                            if (stopOnError) {
                                reject(error);
                            }
                            else {
                                errors.push(error);
                                resolvingCount--;
                                // In that case we can't really continue regardless of `stopOnError` state
                                // since an iterable is likely to continue throwing after it throws once.
                                // If we continue calling `next()` indefinitely we will likely end up
                                // in an infinite loop of failed iteration.
                                try {
                                    yield next();
                                }
                                catch (error) {
                                    reject(error);
                                }
                            }
                        }
                    }))();
                });
                // Create the concurrent runners in a detached (non-awaited)
                // promise. We need this so we can await the `next()` calls
                // to stop creating runners before hitting the concurrency limit
                // if the iterable has already been marked as done.
                // NOTE: We *must* do this for async iterators otherwise we'll spin up
                // infinite `next()` calls by default and never start the event loop.
                (() => __awaiter(this, void 0, void 0, function* () {
                    for (let index = 0; index < concurrency; index++) {
                        try {
                            // eslint-disable-next-line no-await-in-loop
                            yield next();
                        }
                        catch (error) {
                            reject(error);
                            break;
                        }
                        if (isIterableDone || isRejected) {
                            break;
                        }
                    }
                }))();
            });
        });
    }
    exports.default = pMap;
    /**
    Return this value from a `mapper` function to skip including the value in the returned array.
    
    @example
    ```
    import pMap, {pMapSkip} from 'p-map';
    import got from 'got';
    
    const sites = [
      getWebsiteFromUsername('sindresorhus'), //=> Promise
      'https://avajs.dev',
      'https://example.invalid',
      'https://github.com'
    ];
    
    const mapper = async site => {
      try {
        const {requestUrl} = await got.head(site);
        return requestUrl;
      } catch {
        return pMapSkip;
      }
    };
    
    const result = await pMap(sites, mapper, {concurrency: 2});
    
    console.log(result);
    //=> ['https://sindresorhus.com/', 'https://avajs.dev/', 'https://github.com/']
    ```
    */
    exports.pMapSkip = Symbol('skip');
});
define("tools/async-array/libs/p-filter", ["require", "exports", "tools/async-array/libs/p-map"], function (require, exports, p_map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    p_map_1 = __importDefault(p_map_1);
    /**
    Filter promises concurrently.
    
    @param input - Iterated over concurrently in the `filterer` function.
    @param filterer - The filterer function that decides whether an element should be included into result.
    
    @example
    ```
    import pFilter from 'p-filter';
    import getWeather from 'get-weather'; // Not a real module
    
    const places = [
      getCapital('Norway').then(info => info.name),
      'Bangkok, Thailand',
      'Berlin, Germany',
      'Tokyo, Japan',
    ];
    
    const filterer = async place => {
      const weather = await getWeather(place);
      return weather.temperature > 30;
    };
    
    const result = await pFilter(places, filterer);
    
    console.log(result);
    //=> ['Bangkok, Thailand']
    ```
    */
    function pFilter(iterable, filterer, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const values = yield (0, p_map_1.default)(iterable, (element, index) => Promise.all([filterer(element, index), element]), options);
            return values.filter(value => Boolean(value[0])).map(value => value[1]);
        });
    }
    exports.default = pFilter;
});
define("tools/async-array/libs/p-every", ["require", "exports", "tools/async-array/libs/p-map"], function (require, exports, p_map_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    p_map_2 = __importDefault(p_map_2);
    class EndError extends Error {
    }
    function test(testFunction) {
        return function (element, index) {
            return __awaiter(this, void 0, void 0, function* () {
                const result = yield testFunction(element, index);
                if (!result) {
                    throw new EndError();
                }
                return result;
            });
        };
    }
    /**
    Test whether *all* promises pass a testing function. Fulfills when *all* promises in `input` and ones returned from `testFunction` are fulfilled, or rejects if any of the promises reject.
    
    @param input - Iterated over concurrently in the `testFunction` function.
    @param testFunction - Predicate function, expected to return a `Promise<boolean>` or `boolean`.
    @returns `true` if all promises passed the test and `false` otherwise.
     */
    function pEvery(iterable, testFunction, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield (0, p_map_2.default)(iterable, test(testFunction), opts);
                return true;
            }
            catch (error) {
                if (error instanceof EndError) {
                    return false;
                }
                throw error;
            }
        });
    }
    exports.default = pEvery;
    ;
});
define("tools/async-array/libs/p-one", ["require", "exports", "tools/async-array/libs/p-map"], function (require, exports, p_map_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    p_map_3 = __importDefault(p_map_3);
    class EndError extends Error {
    }
    function test(testFunction) {
        return function (element, index) {
            return __awaiter(this, void 0, void 0, function* () {
                const value = yield testFunction(element, index);
                if (value) {
                    throw new EndError();
                }
                return value;
            });
        };
    }
    /**
    Test whether *some* promise passes a testing function. Fulfills when *any* promise in `input` and ones returned from `testFunction` are fulfilled, or rejects if any of the promises reject.
    
    @param input - Iterated over concurrently in the `testFunction` function.
    @param testFunction - Predicate function, expected to return a `Promise<boolean>` or `boolean`.
    @returns `true` if any promise passed the test and `false` otherwise.
    */
    function pOne(iterable, testFunction, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield (0, p_map_3.default)(iterable, test(testFunction), options);
                return false;
            }
            catch (error) {
                if (error instanceof EndError) {
                    return true;
                }
                throw error;
            }
        });
    }
    exports.default = pOne;
    ;
});
define("tools/async-array/libs/p-reduce", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
    Reduce a list of values using promises into a promise for a value.
    
    @param input - Iterated over serially in the `reducer` function.
    @param reducer - Expected to return a value. If a `Promise` is returned, it's awaited before continuing with the next iteration.
    @param initialValue - Value to use as `previousValue` in the first `reducer` invocation.
    @returns A `Promise` that is fulfilled when all promises in `input` and ones returned from `reducer` are fulfilled, or rejects if any of the promises reject. The resolved value is the result of the reduction.
    
    @example
    ```
    import pReduce from 'p-reduce';
    import humanInfo from 'human-info'; // Not a real module
    
    const names = [
      getUser('sindresorhus').then(info => info.name),
      'Addy Osmani',
      'Pascal Hartig',
      'Stephen Sawchuk'
    ];
    
    const totalAge = await pReduce(names, async (total, name) => {
      const info = await humanInfo(name);
      return total + info.age;
    }, 0);
    
    console.log(totalAge);
    //=> 125
    ```
    */
    function pReduce(iterable, reducer, initialValue) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const iterator = iterable[Symbol.iterator]();
                let index = 0;
                const next = (total) => __awaiter(this, void 0, void 0, function* () {
                    const element = iterator.next();
                    if (element.done) {
                        resolve(total);
                        return;
                    }
                    try {
                        const [resolvedTotal, resolvedValue] = yield Promise.all([total, element.value]);
                        next(reducer(resolvedTotal, resolvedValue, index++));
                    }
                    catch (error) {
                        reject(error);
                    }
                });
                next(initialValue);
            });
        });
    }
    exports.default = pReduce;
});
define("tools/async-array/index", ["require", "exports", "tools/async-array/libs/p-filter", "tools/async-array/libs/p-map", "tools/async-array/libs/p-every", "tools/async-array/libs/p-one", "tools/async-array/libs/p-reduce"], function (require, exports, p_filter_1, p_map_4, p_every_1, p_one_1, p_reduce_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AsyncArray = void 0;
    p_filter_1 = __importDefault(p_filter_1);
    p_map_4 = __importDefault(p_map_4);
    p_every_1 = __importDefault(p_every_1);
    p_one_1 = __importDefault(p_one_1);
    p_reduce_1 = __importDefault(p_reduce_1);
    class AsyncArray extends Array {
        constructor(options) {
            super();
            this.options = Object.assign({}, AsyncArray.defaultOptions, options);
        }
        static fromWithOptions(iterable, options) {
            const elements = Array.from(iterable);
            let arr = new AsyncArray(options);
            for (let i = 0; i < elements.length; i++) {
                arr.push(elements[i]);
            }
            return arr;
        }
        static from(iterable) {
            return this.fromWithOptions(iterable);
        }
        static of(...iterable) {
            return AsyncArray.from(iterable);
        }
        mapAsync(callbackfn) {
            return __awaiter(this, void 0, void 0, function* () {
                const r = yield (0, p_map_4.default)(this, callbackfn, this.options);
                return AsyncArray.from(r);
            });
        }
        forEachAsync(callbackfn) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.mapAsync(callbackfn);
            });
        }
        filterAsync(callbackfn) {
            return __awaiter(this, void 0, void 0, function* () {
                const r = yield (0, p_filter_1.default)(this, callbackfn, this.options);
                return AsyncArray.from(r);
            });
        }
        everyAsync(callbackfn) {
            return __awaiter(this, void 0, void 0, function* () {
                return yield (0, p_every_1.default)(this, callbackfn, this.options);
            });
        }
        someAsync(callbackfn) {
            return __awaiter(this, void 0, void 0, function* () {
                return yield (0, p_one_1.default)(this, callbackfn, this.options);
            });
        }
        reduceAsync(callbackfn) {
            return __awaiter(this, void 0, void 0, function* () {
                return yield (0, p_reduce_1.default)(this, callbackfn);
            });
        }
    }
    exports.AsyncArray = AsyncArray;
    AsyncArray.defaultOptions = { concurrency: 1 };
});
define("tools/blockscan/helpers", ["require", "exports", "tools/blockscan/types", "tools/async-array/index", "lodash", "delay"], function (require, exports, types_2, async_array_1, lodash_1, delay_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.sliceTask = exports.multiQuery = exports.retry = void 0;
    delay_1 = __importDefault(delay_1);
    function _retry(el, request, onAttempt, times = 0, errors = []) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield request(el);
            }
            catch (e) {
                errors.push(e);
                times++;
                let continueAttempt = true;
                if (times > 5) {
                    console.error(e);
                }
                if (onAttempt) {
                    continueAttempt = yield onAttempt(e, times);
                }
                if (continueAttempt) {
                    return yield _retry(el, request, onAttempt, times, errors);
                }
                throw errors;
            }
        });
    }
    function retry(el, request, onAttempt) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield _retry(el, request, onAttempt, 0, []);
        });
    }
    exports.retry = retry;
    /**
     * Multiple query to boost the query rate.
     */
    function multiQuery(args) {
        return __awaiter(this, void 0, void 0, function* () {
            let { elments, keys, query, breakpoint, uniqWith, request, prevData, cache } = args;
            const sort = query.sort ? query.sort : types_2.Sort.ASC;
            const { from, to } = keys;
            const lastLog = (0, lodash_1.last)(prevData);
            if (lastLog) {
                const rangeValue = breakpoint(lastLog);
                query = Object.assign(Object.assign({}, query), (sort === types_2.Sort.ASC ? { [from]: rangeValue } : { [to]: rangeValue }));
            }
            // multiple query
            const temp = yield async_array_1.AsyncArray.fromWithOptions(elments, { concurrency: elments.length }).mapAsync((el, i) => __awaiter(this, void 0, void 0, function* () {
                return yield retry({ el, query, i }, ({ el, query, i }) => __awaiter(this, void 0, void 0, function* () {
                    return yield request(el, query, i);
                }));
            }));
            // debugger
            const logs = (0, lodash_1.flatten)(temp);
            // remove the duplicate elements
            if (prevData.length > 0) {
                let i = 0;
                while (i < logs.length) {
                    const log = logs[i];
                    const index = (0, lodash_1.findLastIndex)(prevData, el => uniqWith(el, log));
                    if (index === -1) {
                        break;
                    }
                    logs.shift();
                    i++;
                }
            }
            if (logs.length > 0) {
                // cache the elements 
                if (cache) {
                    yield cache(logs);
                }
                if (logs.length > 0) {
                    args.prevData = (0, lodash_1.concat)(prevData, logs).slice(-10000);
                    return yield multiQuery(Object.assign({}, args));
                }
            }
        });
    }
    exports.multiQuery = multiQuery;
    function poll(chunk, parentIndex, feedAmount, request, requestDelay = 0, _result, _retries) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = _result ? _result : new Array(chunk.length).fill(null);
            const retries = _retries ? _retries : new Array(chunk.length).fill(1);
            if (result.length !== chunk.length || retries.length !== chunk.length) {
                throw new Error('result.length should be equal to chunk.');
            }
            if (result.every(el => el !== null)) {
                return result.map(el => el.data);
            }
            yield async_array_1.AsyncArray.fromWithOptions(chunk, { concurrency: feedAmount }).forEachAsync((el, i) => __awaiter(this, void 0, void 0, function* () {
                if (!result[i]) {
                    const data = yield retry({ el, index: parentIndex * chunk.length + i }, request, (e, times) => __awaiter(this, void 0, void 0, function* () {
                        retries[i] = times;
                        if (requestDelay) {
                            yield (0, delay_1.default)(requestDelay);
                        }
                        return true;
                    }));
                    result[i] = { data };
                }
            }));
            return yield poll(chunk, parentIndex, feedAmount, request, requestDelay, result, retries);
        });
    }
    function sliceTask(feedData, chunks, request, requestDelay, saveData) {
        return __awaiter(this, void 0, void 0, function* () {
            const dataChunks = (0, lodash_1.chunk)(feedData, chunks);
            const result = yield async_array_1.AsyncArray.fromWithOptions(dataChunks, { concurrency: 1 }).mapAsync((chunk, i) => __awaiter(this, void 0, void 0, function* () {
                const data = yield poll(chunk, i, chunks, request, requestDelay);
                if (saveData) {
                    yield saveData(data, chunk);
                }
                return data;
            }));
            return (0, lodash_1.flatten)(result);
        });
    }
    exports.sliceTask = sliceTask;
});
define("abis/IERC165", [], [
    {
        "inputs": [
            {
                "internalType": "bytes4",
                "name": "interfaceId",
                "type": "bytes4"
            }
        ],
        "name": "supportsInterface",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]);
define("abis/IERC20", [], [
    {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_spender",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_from",
                "type": "address"
            },
            {
                "name": "_to",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "transferFrom",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "name": "",
                "type": "uint8"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "_owner",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "name": "balance",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_to",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "_owner",
                "type": "address"
            },
            {
                "name": "_spender",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "payable": true,
        "stateMutability": "payable",
        "type": "fallback"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    }
]);
define("tools/blockscan/fast-scan", ["require", "exports", "tools/fs", "tools/blockscan/blockscan", "tools/blockscan/helpers", "tools/blockscan/types", "path", "ethers", "lodash", "fs-extra", "delay", "abis/IERC165", "abis/IERC20", "evm"], function (require, exports, fs_1, blockscan_1, helpers_1, types_3, path_3, ethers_1, lodash_2, fs_extra_3, delay_2, IERC165_json_1, IERC20_json_1, evm_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FastBTTCScan = exports.FastEtherScan = exports.FastBscScan = exports.FastScan = void 0;
    fs_1 = __importDefault(fs_1);
    path_3 = __importDefault(path_3);
    fs_extra_3 = __importDefault(fs_extra_3);
    delay_2 = __importDefault(delay_2);
    IERC165_json_1 = __importDefault(IERC165_json_1);
    IERC20_json_1 = __importDefault(IERC20_json_1);
    const erc20Functions = [
        'name()',
        'approve(address,uint256)',
        'totalSupply()',
        'decimals()',
        'balanceOf(address)',
        'symbol()',
        'transfer(address,uint256)',
        'allowance(address,address)'
    ];
    class FastScan {
        constructor(baseURL, apiKeys, providers, output) {
            this.offset = 100;
            if (apiKeys.length > 100) {
                throw new Error('apiKey count should be less then 100');
            }
            this.blockScans = apiKeys.map(apiKey => blockscan_1.BlockScan.query(baseURL, apiKey));
            if (providers.length === 0) {
                throw new Error('provider count should be greater than 0');
            }
            this.providers = providers;
            this.output = output;
        }
        dir(args) {
            return path_3.default.resolve(this.output, Object.values(args).join('-')).toLowerCase();
        }
        _getNativeTxList(params) {
            const offset = this.offset;
            const args = Object.assign({
                action: 'txlist',
                startblock: 0,
                endblock: 'latest',
                sort: types_3.Sort.ASC
            }, params);
            const file = new fs_1.default(this.dir(args), { offset });
            return { file, args };
        }
        getNativeTxList(params) {
            return this._getNativeTxList(params).file;
        }
        getNativeTxListDir(params) {
            return this.dir(this._getNativeTxList(params).args);
        }
        handleBlockScanError(e) {
            return __awaiter(this, void 0, void 0, function* () {
                debugger;
            });
        }
        getTxList(params) {
            return __awaiter(this, void 0, void 0, function* () {
                const { file, args } = this._getNativeTxList(params);
                yield (0, helpers_1.multiQuery)({
                    elments: this.blockScans,
                    keys: {
                        from: 'startblock',
                        to: 'endblock'
                    },
                    query: args,
                    breakpoint: (tx) => Number(tx.blockNumber),
                    uniqWith: (a, b) => a.hash === b.hash,
                    request: (query, qs, i) => __awaiter(this, void 0, void 0, function* () {
                        return yield query.getTxList(Object.assign({ page: i + 1, offset: this.offset }, qs));
                    }),
                    prevData: file.tailData(10000),
                    cache: (data) => __awaiter(this, void 0, void 0, function* () {
                        file.append(data);
                    })
                });
                return file;
            });
        }
        _getNativeLogs(params) {
            const offset = this.offset;
            const args = Object.assign({
                action: 'getLogs',
                fromBlock: 0,
                toBlock: 'latest',
            }, params);
            const file = new fs_1.default(this.dir(args), { offset });
            return { file, args };
        }
        getNativeLogsDir(params) {
            return this.dir(this._getNativeLogs(params).args);
        }
        getNativeLogs(params) {
            return this._getNativeLogs(params).file;
        }
        getLogs(params, onDataReceived) {
            return __awaiter(this, void 0, void 0, function* () {
                const { file, args } = this._getNativeLogs(params);
                yield (0, helpers_1.multiQuery)({
                    elments: this.blockScans,
                    keys: {
                        from: 'fromBlock',
                        to: 'toBlock'
                    },
                    query: args,
                    breakpoint: (log) => Number(log.blockNumber),
                    uniqWith: (a, b) => {
                        return a.transactionIndex === b.transactionIndex && a.logIndex === b.logIndex && a.blockNumber === b.blockNumber;
                    },
                    request: (query, qs, i) => __awaiter(this, void 0, void 0, function* () {
                        return yield query.getLogs(Object.assign({ page: i + 1, offset: this.offset }, qs));
                    }),
                    prevData: file.tailData(10000),
                    cache: (data) => __awaiter(this, void 0, void 0, function* () {
                        file.append(data);
                        onDataReceived && onDataReceived(data, file);
                    })
                });
                return file;
            });
        }
        getNativeTxReceiptsForLogs(params) {
            const { args } = this._getNativeLogs(params);
            const receiptFt = new fs_1.default(this.dir(Object.assign(args, { receipts: 'receipts' })), { offset: this.offset });
            return receiptFt;
        }
        getNativeTxReceiptsForTxs(params) {
            const { args } = this._getNativeTxList(params);
            const receiptFt = new fs_1.default(this.dir(Object.assign(args, { receipts: 'receipts' })), { offset: this.offset });
            return receiptFt;
        }
        getTxReceiptsForHash(file, args, hashPropName, onDataReceived) {
            return __awaiter(this, void 0, void 0, function* () {
                const receiptFt = new fs_1.default(this.dir(Object.assign(args, { receipts: 'receipts' })), { offset: this.offset });
                const next = file.read(receiptFt.length);
                let data;
                const lastPageData = receiptFt.readLastPageData();
                const cache = lastPageData ? lastPageData.reduce((prev, cur) => {
                    prev[cur.transactionHash] = cur;
                    return prev;
                }, {}) : {};
                const providers = [
                    ...this.providers,
                ];
                const blockScans = [
                    ...this.blockScans,
                ];
                while (data = next()) {
                    const uniqHashData = (0, lodash_2.uniqBy)(data, el => el[hashPropName]).map(el => el[hashPropName]);
                    let clearIds = [];
                    const fetchByProvider = (provider, hash) => {
                        return new Promise((resolve, reject) => {
                            provider.send('eth_getTransactionReceipt', [hash]).then(resolve).catch((e) => {
                                if (ethers_1.ethers.utils.Logger.errors.TIMEOUT === e.code) {
                                    console.log(`fetch by etherscan: ${hash}`);
                                    const blockScan = blockScans.shift();
                                    if (blockScan) {
                                        blockScans.push(blockScan);
                                        blockScan.getTxReceipt(hash).then(resolve).catch((e) => {
                                            console.log(e);
                                            if (e.message === 'Max rate limit reached') {
                                                const index = blockScans.findIndex(b => b.apiKey === blockScan.apiKey);
                                                if (index > -1) {
                                                    blockScans.splice(index, 1);
                                                }
                                            }
                                            reject(e);
                                        });
                                    }
                                    else {
                                        reject(new Error(`fetch timeout with provider ${hash}`));
                                    }
                                }
                                else {
                                    reject(e);
                                }
                            });
                        });
                    };
                    yield (0, helpers_1.sliceTask)(uniqHashData, providers.length, ({ el: hash, index }) => __awaiter(this, void 0, void 0, function* () {
                        const provider = providers.shift();
                        if (provider) {
                            providers.push(provider);
                            if (!cache[hash]) {
                                try {
                                    cache[hash] = yield fetchByProvider(provider, hash);
                                }
                                catch (e) {
                                    console.error(e);
                                    throw e;
                                }
                            }
                            if (!cache[hash]) {
                                debugger;
                                console.error(`receipt is null for ${hash}`);
                                throw new Error(`receipt is null for ${hash}`);
                            }
                            return cache[hash];
                        }
                        throw new Error('provider is null');
                    }), 200);
                    clearIds.forEach(id => clearTimeout(id));
                    const dataToWrite = data.map(el => cache[el[hashPropName]]);
                    receiptFt.append(dataToWrite);
                    onDataReceived && onDataReceived(dataToWrite, receiptFt);
                }
                return receiptFt;
            });
        }
        getTxReceiptsForLogs(params, onDataReceived) {
            return __awaiter(this, void 0, void 0, function* () {
                const { file, args } = this._getNativeLogs(params);
                return yield this.getTxReceiptsForHash(file, args, 'transactionHash', onDataReceived);
            });
        }
        getTxReceiptsForTxs(params, onDataReceived) {
            return __awaiter(this, void 0, void 0, function* () {
                const { file, args } = this._getNativeTxList(params);
                return yield this.getTxReceiptsForHash(file, args, 'hash', onDataReceived);
            });
        }
        writeFile(targetDir, filename, data) {
            fs_extra_3.default.ensureDirSync(targetDir);
            const file = path_3.default.resolve(targetDir, filename);
            filename.endsWith('json') ? fs_extra_3.default.writeJsonSync(file, data) : fs_extra_3.default.writeFileSync(file, data);
            return data;
        }
        readFile(targetDir, filename, fill) {
            const file = path_3.default.resolve(targetDir, filename);
            if (fs_extra_3.default.existsSync(file)) {
                return (filename.endsWith('json') ? fs_extra_3.default.readJsonSync(file) : fs_extra_3.default.readFileSync(file));
            }
            return fill;
        }
        parseContract(address, code, mergedAbi, httpConfig) {
            return __awaiter(this, void 0, void 0, function* () {
                let abi = [];
                if (code.ABI !== 'Contract source code not verified' && code.ABI) {
                    try {
                        abi = JSON.parse(code.ABI);
                    }
                    catch (e) {
                        console.error(e, address);
                    }
                }
                let toMerged = [...abi];
                const index = toMerged.findIndex(el => el.type === 'constructor');
                if (index > -1) {
                    toMerged.splice(index, 1);
                }
                mergedAbi.push(...toMerged);
                let sourcecode = code.SourceCode;
                let temp = sourcecode.trim();
                if (temp.startsWith('{{') && temp.endsWith('}}')) {
                    temp = temp.slice(1, -1);
                    try {
                        const sourceConfig = JSON.parse(temp);
                        sourcecode = Object.keys(sourceConfig.sources).reduce((prev, cur) => {
                            const val = sourceConfig.sources[cur];
                            if (val.content) {
                                return `${prev}${'//  ' + cur}\r\n${val.content}\r\n`;
                            }
                            return prev;
                        }, '');
                    }
                    catch (e) {
                        console.log(e, address);
                    }
                }
                let implementation = null;
                // implemention === address 会出现循环请求
                if (code.Implementation && ethers_1.ethers.utils.isAddress(code.Implementation) && ethers_1.ethers.utils.getAddress(code.Implementation).toLowerCase() !== ethers_1.ethers.utils.getAddress(address).toLowerCase()) {
                    implementation = yield this.getContract(code.Implementation, mergedAbi, httpConfig);
                }
                return {
                    address,
                    mergedAbi,
                    abi,
                    sourcecode,
                    bytecode: code.Bytecode,
                    implementation,
                    contractName: code.ContractName,
                    constructorArguments: code.ConstructorArguments,
                    compilerVersion: code.CompilerVersion,
                    optimizationUsed: code.OptimizationUsed,
                    runs: code.Runs,
                    evmVersion: code.EVMVersion,
                    library: code.Library,
                    licenseType: code.LicenseType,
                    proxy: code.Proxy,
                    swarmSource: code.SwarmSource
                };
            });
        }
        getContract(addr, mergedAbi, httpConfig) {
            return __awaiter(this, void 0, void 0, function* () {
                const address = ethers_1.ethers.utils.getAddress(addr).toLowerCase();
                const dir = this.dir({ contracts: 'contracts' });
                const { provider, blockScan } = httpConfig;
                const filename = `${address}.json`;
                const file = this.readFile(dir, filename, null);
                if (file) {
                    if (file.length !== 1) {
                        throw new Error(`${address} contract config length > 1`);
                    }
                    const code = file[0];
                    return yield this.parseContract(address, code, mergedAbi, httpConfig);
                }
                const bytecode = yield provider.getCode(address);
                if (bytecode === '0x') {
                    return null;
                }
                const info = yield blockScan.getContractInfo({ address });
                if (info.length !== 1) {
                    throw new Error(`${address} contract config length > 1`);
                }
                const code = Object.assign(Object.assign({}, info[0]), { Bytecode: bytecode });
                let implementation = code.Implementation;
                if (!implementation) {
                    const slot = yield provider.getStorageAt(address, '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc');
                    const implementionSlot = ethers_1.ethers.utils.hexStripZeros(slot);
                    if (implementionSlot !== '0x') {
                        code.Implementation = implementionSlot;
                    }
                }
                this.writeFile(dir, filename, [code]);
                return yield this.parseContract(address, code, mergedAbi, httpConfig);
            });
        }
        requestData(data, fn, usage = { provider: true, blockScan: true }) {
            return __awaiter(this, void 0, void 0, function* () {
                const providers = usage.provider ? [...this.providers] : [];
                const blockScans = usage.blockScan ? [...this.blockScans] : [];
                const length = usage.provider && usage.blockScan ? Math.min(blockScans.length, providers.length) : usage.provider ? providers.length : usage.blockScan ? blockScans.length : 0;
                if (length === 0) {
                    throw new Error('provider or blockScan is required.');
                }
                return yield (0, helpers_1.sliceTask)(data, length, ({ el, index }) => __awaiter(this, void 0, void 0, function* () {
                    const provider = usage.provider && providers.shift() || null;
                    if (provider) {
                        providers.push(provider);
                    }
                    const blockScan = usage.blockScan && blockScans.shift() || null;
                    if (blockScan) {
                        blockScans.push(blockScan);
                    }
                    return yield fn(el, index, { provider, blockScan });
                }));
            });
        }
        getContractsInfo(addrs) {
            return __awaiter(this, void 0, void 0, function* () {
                const dir = this.dir({ contracts: 'contracts' });
                const providers = [...this.providers];
                const blockScans = [...this.blockScans];
                const eoaFileName = '0x000000000000000000000000000000000000000-eoa.json';
                const eoaAddrs = this.readFile(dir, eoaFileName, []);
                const fn = ({ el, index }) => __awaiter(this, void 0, void 0, function* () {
                    const address = ethers_1.ethers.utils.getAddress(el).toLowerCase();
                    if (eoaAddrs.find(el => el === address)) {
                        return null;
                    }
                    const provider = providers.shift();
                    if (provider) {
                        providers.push(provider);
                        const blockScan = blockScans.shift();
                        if (blockScan) {
                            blockScans.push(blockScan);
                            try {
                                const contract = yield this.getContract(address, [], { provider, blockScan });
                                if (!contract) {
                                    eoaAddrs.push(address);
                                    this.writeFile(dir, eoaFileName, eoaAddrs);
                                }
                                return contract;
                            }
                            catch (error) {
                                const e = error;
                                console.log(e);
                                if (e.message === 'Max rate limit reached') {
                                    const index = blockScans.findIndex(b => b.apiKey === blockScan.apiKey);
                                    if (index > -1) {
                                        blockScans.splice(index, 1);
                                    }
                                }
                                throw error;
                            }
                        }
                        else {
                            yield (0, delay_2.default)(500);
                            return yield fn({ el, index });
                        }
                    }
                    else {
                        yield (0, delay_2.default)(500);
                        return yield fn({ el, index });
                    }
                });
                return yield (0, helpers_1.sliceTask)(addrs, Math.min(blockScans.length, providers.length), fn);
            });
        }
        getTokenType(address, { provider, blockScan }) {
            return __awaiter(this, void 0, void 0, function* () {
                if (provider && blockScan) {
                    try {
                        const contract = new ethers_1.ethers.Contract(address, IERC165_json_1.default, provider);
                        const isERC1155 = yield contract.supportsInterface(0xd9b67a26);
                        if (isERC1155) {
                            return types_3.TokenType.ERC1155;
                        }
                        const isERC721 = yield contract.supportsInterface(0x80ac58cd);
                        if (isERC721) {
                            return types_3.TokenType.ERC721;
                        }
                    }
                    catch (e) {
                    }
                    try {
                        const contractConfig = yield this.getContract(address, [], { provider, blockScan });
                        if (contractConfig) {
                            if (contractConfig.mergedAbi.length > 0) {
                                const interf = new ethers_1.ethers.utils.Interface(contractConfig.mergedAbi);
                                const fragments = interf.fragments.map(fragment => {
                                    try {
                                        return fragment.format();
                                    }
                                    catch (e) {
                                        return null;
                                    }
                                });
                                if (erc20Functions.every(f => !!fragments.find(fn => fn === f))) {
                                    return types_3.TokenType.ERC20;
                                }
                            }
                            const evm = new evm_1.EVM(contractConfig.bytecode);
                            const functions = evm.getFunctions();
                            if (erc20Functions.every(f => !!functions.find(fn => fn.toLowerCase() === f.toLowerCase()))) {
                                return types_3.TokenType.ERC20;
                            }
                        }
                    }
                    catch (e) {
                        console.error(e);
                        throw e;
                    }
                    try {
                        const contract = new ethers_1.ethers.Contract(address, IERC20_json_1.default, provider);
                        const symbol = yield contract.symbol();
                        const decimals = yield contract.decimals();
                        const name = yield contract.name();
                        const totalSupply = yield contract.totalSupply();
                        const balanceOf = yield contract.balanceOf('0x25677E84Be364E0eEAc283baaAa27fFcE6081397');
                        const allowance = yield contract.allowance('0x25677E84Be364E0eEAc283baaAa27fFcE6081397', '0x0fcc024Ec8F8B038270AABFEfc13EE326eB5c39a');
                        return types_3.TokenType.ERC20;
                    }
                    catch (e) {
                        return types_3.TokenType.NONE;
                    }
                }
                yield (0, delay_2.default)(200);
                return yield this.getTokenType(address, { provider, blockScan });
            });
        }
        getContractsType(addrs) {
            return __awaiter(this, void 0, void 0, function* () {
                const file = this.readFile(this.dir({ tokens: 'tokens' }), 'types.json', {});
                yield this.requestData(addrs.map(el => el.toLowerCase()), (address, _, { provider, blockScan }) => __awaiter(this, void 0, void 0, function* () {
                    if (file[address]) {
                        return file[address];
                    }
                    const tokenType = yield this.getTokenType(address, { provider, blockScan });
                    file[address] = tokenType;
                    this.writeFile(this.dir({ tokens: 'tokens' }), 'types.json', file);
                    return tokenType;
                }));
                return file;
            });
        }
        getERC20Params(address, provider) {
            return __awaiter(this, void 0, void 0, function* () {
                const contract = new ethers_1.ethers.Contract(address, IERC20_json_1.default, provider);
                const symbol = yield contract.symbol();
                const name = yield contract.name();
                const decimals = yield contract.decimals();
                return { symbol, name, decimals: ethers_1.BigNumber.from(decimals).toNumber() };
            });
        }
        getERC20ContractsParams(addrs) {
            return __awaiter(this, void 0, void 0, function* () {
                const file = this.readFile(this.dir({ tokens: 'tokens' }), 'erc20.json', {});
                yield this.requestData(addrs.map(el => el.toLowerCase()), (address, _, { provider }) => __awaiter(this, void 0, void 0, function* () {
                    if (file[address]) {
                        return file[address];
                    }
                    if (!provider) {
                        yield (0, delay_2.default)(200);
                        throw new Error('no provider');
                    }
                    try {
                        const tokenType = yield this.getERC20Params(address, provider);
                        file[address] = tokenType;
                        this.writeFile(this.dir({ tokens: 'tokens' }), 'erc20.json', file);
                    }
                    catch (e) {
                        console.error(`${address} is not erc20.`);
                    }
                }), { blockScan: false, provider: true });
                return file;
            });
        }
    }
    exports.FastScan = FastScan;
    class FastBscScan extends FastScan {
        constructor(apiKeys, providers, output) {
            super('https://api.bscscan.com', apiKeys, providers, output);
        }
    }
    exports.FastBscScan = FastBscScan;
    class FastEtherScan extends FastScan {
        constructor(apiKeys, providers, output) {
            super('https://api.etherscan.io', apiKeys, providers, output);
        }
    }
    exports.FastEtherScan = FastEtherScan;
    class FastBTTCScan extends FastScan {
        constructor(apiKeys, providers, output) {
            super('https://api.bttcscan.com', apiKeys, providers, output);
        }
    }
    exports.FastBTTCScan = FastBTTCScan;
});
define("tools/blockscan/index", ["require", "exports", "tools/blockscan/types", "tools/blockscan/blockscan"], function (require, exports, types_4, blockscan_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BscScan = exports.BlockScan = exports.Sort = exports.Status = void 0;
    Object.defineProperty(exports, "Status", { enumerable: true, get: function () { return types_4.Status; } });
    Object.defineProperty(exports, "Sort", { enumerable: true, get: function () { return types_4.Sort; } });
    Object.defineProperty(exports, "BlockScan", { enumerable: true, get: function () { return blockscan_2.BlockScan; } });
    Object.defineProperty(exports, "BscScan", { enumerable: true, get: function () { return blockscan_2.BscScan; } });
});
define("tools/query-helper/logs", ["require", "exports"], function (require, exports) {
    "use strict";
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
});
define("tools/ethers-extend/utils", ["require", "exports", "ethers"], function (require, exports, ethers_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.utils = void 0;
    exports.utils = {
        lowercaseAddress(addr) {
            return ethers_2.ethers.utils.getAddress(addr).toLowerCase();
        },
        isSameAddress(addr1, addr2) {
            return ethers_2.ethers.utils.getAddress(addr1) === ethers_2.ethers.utils.getAddress(addr2);
        }
    };
});
define("tools/ethers-extend/index", ["require", "exports", "tools/ethers-extend/utils"], function (require, exports, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.utils = void 0;
    Object.defineProperty(exports, "utils", { enumerable: true, get: function () { return utils_1.utils; } });
});
define("index", ["require", "exports", "tools/fs", "tools/export-excel", "tools/query-helper/logs", "tools/async-array/index", "tools/ethers-extend/index", "tools/blockscan/index", "tools/blockscan/blockscan", "tools/blockscan/fast-scan"], function (require, exports, fs_2, export_excel_1, logs_1, async_array_2, ethers_extend_1, index_1, blockscan_3, fast_scan_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FastEtherScan = exports.FastBscScan = exports.FastBTTCScan = exports.FastScan = exports.BscScan = exports.BlockScan = exports.utils = exports.AsyncArray = exports.queryLogsAndReceipts = exports.exportExcel = exports.FileTool = void 0;
    Object.defineProperty(exports, "FileTool", { enumerable: true, get: function () { return __importDefault(fs_2).default; } });
    Object.defineProperty(exports, "exportExcel", { enumerable: true, get: function () { return export_excel_1.exportExcel; } });
    Object.defineProperty(exports, "queryLogsAndReceipts", { enumerable: true, get: function () { return logs_1.queryLogsAndReceipts; } });
    Object.defineProperty(exports, "AsyncArray", { enumerable: true, get: function () { return async_array_2.AsyncArray; } });
    Object.defineProperty(exports, "utils", { enumerable: true, get: function () { return ethers_extend_1.utils; } });
    __exportStar(index_1, exports);
    Object.defineProperty(exports, "BlockScan", { enumerable: true, get: function () { return blockscan_3.BlockScan; } });
    Object.defineProperty(exports, "BscScan", { enumerable: true, get: function () { return blockscan_3.BscScan; } });
    Object.defineProperty(exports, "FastScan", { enumerable: true, get: function () { return fast_scan_1.FastScan; } });
    Object.defineProperty(exports, "FastBTTCScan", { enumerable: true, get: function () { return fast_scan_1.FastBTTCScan; } });
    Object.defineProperty(exports, "FastBscScan", { enumerable: true, get: function () { return fast_scan_1.FastBscScan; } });
    Object.defineProperty(exports, "FastEtherScan", { enumerable: true, get: function () { return fast_scan_1.FastEtherScan; } });
});
