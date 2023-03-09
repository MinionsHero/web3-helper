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
exports.BlockScan = void 0;
const axios_1 = __importDefault(require("axios"));
const qs_1 = __importDefault(require("qs"));
const types_1 = require("./types");
var Module;
(function (Module) {
    Module["Account"] = "account";
    Module["Contract"] = "contract";
    Module["Block"] = "block";
    Module["Logs"] = "logs";
    Module["Proxy"] = "proxy";
})(Module || (Module = {}));
class BlockScan {
    constructor(baseURL, apiKey, timeout = 10000, axiosConfig) {
        this.apiKey = apiKey;
        this.baseURL = baseURL;
        this.timeout = timeout;
        this.axiosConfig = axiosConfig;
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
                const response = yield axios_1.default.get(url, Object.assign({ responseType: 'json' }, this.axiosConfig));
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
