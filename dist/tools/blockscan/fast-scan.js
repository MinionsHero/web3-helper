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
exports.FastScan = void 0;
const fs_1 = __importDefault(require("../fs"));
const helpers_1 = require("./helpers");
const types_1 = require("./types");
const path_1 = __importDefault(require("path"));
const ethers_1 = require("ethers");
const lodash_1 = require("lodash");
const fs_extra_1 = __importDefault(require("fs-extra"));
const delay_1 = __importDefault(require("delay"));
const IERC165_json_1 = __importDefault(require("../../abis/IERC165.json"));
const IERC20_json_1 = __importDefault(require("../../abis/IERC20.json"));
const evm_1 = require("evm");
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
    constructor(blockScans, providers, output) {
        this.offset = 100;
        if (blockScans.length > 100) {
            throw new Error('apiKey count should be less then 100');
        }
        this.blockScans = blockScans;
        if (providers.length === 0) {
            throw new Error('provider count should be greater than 0');
        }
        this.providers = providers;
        this.output = output;
    }
    dir(args) {
        return path_1.default.resolve(this.output, Object.values(args).join('-')).toLowerCase();
    }
    /*------------------------------------ERC20 Token Transfer Events-----------------------------------------*/
    _getNativeTokenERC20Txs(params) {
        const offset = this.offset;
        const args = Object.assign({
            action: 'tokentx',
            startblock: 0,
            endblock: 'latest',
            sort: types_1.Sort.ASC
        }, params);
        const file = new fs_1.default(this.dir(args), { offset });
        return { file, args };
    }
    getNativeTokenERC20Txs(params) {
        return this._getNativeTokenERC20Txs(params).file;
    }
    getTokenERC20Txs(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { file, args } = this._getNativeTokenERC20Txs(params);
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
                    return yield query.getTokenERC20Txs(Object.assign({ page: i + 1, offset: this.offset }, qs));
                }),
                prevData: file.tailData(10000),
                cache: (data) => __awaiter(this, void 0, void 0, function* () {
                    file.append(data);
                })
            });
            return file;
        });
    }
    /*-----------------------------------------------------------------------------*/
    _getNativeTxList(params) {
        const offset = this.offset;
        const args = Object.assign({
            action: 'txlist',
            startblock: 0,
            endblock: 'latest',
            sort: types_1.Sort.ASC
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
                const uniqHashData = (0, lodash_1.uniqBy)(data, el => el[hashPropName]).map(el => el[hashPropName]);
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
    /**------------------------txlist--------------------------**/
    _getNativeTxs(params) {
        const offset = this.offset;
        const args = Object.assign({
            action: 'native-txlist'
        }, params);
        const file = new fs_1.default(this.dir(args), { offset });
        return { file, args };
    }
    getNativeTxs(params) {
        return this._getNativeTxs(params).file;
    }
    writeNativeTxs(params, data) {
        const ft = this._getNativeTxs(params).file;
        ft.append(data);
    }
    getReceipts(params, onDataReceived) {
        return __awaiter(this, void 0, void 0, function* () {
            const { file, args } = this._getNativeTxs(params);
            return yield this.getTxReceiptsForHash(file, args, 'hash', onDataReceived);
        });
    }
    getNativeReceipts(params) {
        const { args } = this._getNativeTxs(params);
        const receiptFt = new fs_1.default(this.dir(Object.assign(args, { receipts: 'receipts' })), { offset: this.offset });
        return receiptFt;
    }
    /**------------------------------------------------------**/
    writeFile(targetDir, filename, data) {
        fs_extra_1.default.ensureDirSync(targetDir);
        const file = path_1.default.resolve(targetDir, filename);
        filename.endsWith('json') ? fs_extra_1.default.writeJsonSync(file, data) : fs_extra_1.default.writeFileSync(file, data);
        return data;
    }
    readFile(targetDir, filename, fill) {
        const file = path_1.default.resolve(targetDir, filename);
        if (fs_extra_1.default.existsSync(file)) {
            return (filename.endsWith('json') ? fs_extra_1.default.readJsonSync(file) : fs_extra_1.default.readFileSync(file));
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
                        yield (0, delay_1.default)(500);
                        return yield fn({ el, index });
                    }
                }
                else {
                    yield (0, delay_1.default)(500);
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
                        return types_1.TokenType.ERC1155;
                    }
                    const isERC721 = yield contract.supportsInterface(0x80ac58cd);
                    if (isERC721) {
                        return types_1.TokenType.ERC721;
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
                                return types_1.TokenType.ERC20;
                            }
                        }
                        const evm = new evm_1.EVM(contractConfig.bytecode);
                        const functions = evm.getFunctions();
                        if (erc20Functions.every(f => !!functions.find(fn => fn.toLowerCase() === f.toLowerCase()))) {
                            return types_1.TokenType.ERC20;
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
                    return types_1.TokenType.ERC20;
                }
                catch (e) {
                    return types_1.TokenType.NONE;
                }
            }
            yield (0, delay_1.default)(200);
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
                    yield (0, delay_1.default)(200);
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
