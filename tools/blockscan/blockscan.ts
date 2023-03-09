import axios, { AxiosRequestConfig } from 'axios'
import qs from 'qs'
import {
    Data,
    Status,
    AccountTxListInternalResponse,
    AccountBalanceQuery,
    AccountBalanceResponse,
    AccountTokenBalanceQuery,
    AccountTokenBalanceResponse,
    AccountTxListInternalQuery,
    AccountTxListQuery,
    Sort,
    AccountMineBlocksQuery,
    AccountERC20TokenTransferEventQuery,
    AccountERC721TokenTransferEventQuery,
    AccountERC1155TokenTransferEventQuery,
    AccountMineBlocksResponse,
    AccountERC20TokenTransferEventResponse,
    AccountERC721TokenTransferEventResponse,
    AccountERC1155TokenTransferEventResponse,
    AccountHistoryBalanceOfEthQuery,
    AccountHistoryBalanceOfEthResponse,
    GetLogsQuery,
    GetLogsResponse,
    GetContractABIQuery,
    GetContractABIResponse,
    GetContractSourceCodeQuery,
    GetContractSourceCodeResponse,
    BlockCountdownQuery,
    BlockCountdownResponse,
    BlockNoByTimestampQuery,
    BlockNoByTimestampResponse,
    BlockRewardQuery,
    BlockRewardResponse,
    AccountTxListResponse,
    GetTxReceipt
} from './types'

enum Module {
    Account = 'account',
    Contract = 'contract',
    Block = 'block',
    Logs = 'logs',
    Proxy = 'proxy'
}

export class BlockScan {
    public apiKey: string
    private baseURL: string
    private timeout: number
    private customFetch: <T>(url: string) => Promise<Data<T>>

    constructor(baseURL: string, apiKey: string, timeout: number = 10000, customFetch?: <T>(url: string) => Promise<Data<T>>) {
        this.apiKey = apiKey
        this.baseURL = baseURL
        this.timeout = timeout
        this.customFetch = customFetch || async function <T>(url: string) {
            const response = await axios.get(url, {
                responseType: 'json'
            })
            var data: Data<T> = response.data
            return data
        }
    }

    // private static availableInstances: BlockScan[] = []

    // public static initAvailableApiKeys(baseURL: string, keys: string[], timeout: number = 10000) {
    //     this.availableInstances = keys.map(key => new BlockScan(baseURL, key, timeout))
    // }

    // public static getAvailable() {
    //     const key = this.availableApiKeys.unshift()
    // }

    public static query(baseURL: string, apiKey: string) {
        return new BlockScan(baseURL, apiKey)
    }

    public setApiKey() {
        this.apiKey = this.apiKey
    }

    private async get<T>(module: string, query: Record<string, any>) {
        const url = this.baseURL + '/api?' + qs.stringify(Object.assign({ apiKey: this.apiKey, module }, query))
        console.log(url)
        try {
            var data: Data<T> = await this.customFetch(url)
            if (data.status && data.status !== Status.SUCCESS) {
                let returnMessage: string = data.message || 'NOTOK';
                if (returnMessage === 'No transactions found' || returnMessage === 'No records found') {
                    return data.result
                }
                if (data.result && typeof data.result === 'string') {
                    returnMessage = data.result;
                } else if (data.message && typeof data.message === 'string') {
                    returnMessage = data.message;
                }
                console.error(returnMessage)
                throw new Error(returnMessage)
            }
            if (data.error) {
                let message = data.error;
                if (typeof data.error === 'object' && data.error.message) {
                    message = data.error.message;
                }
                console.error(message)
                throw message
            }
            return data.result
        } catch (e) {
            debugger
            throw e
        }

    }

    /**
     * Returns the amount of Tokens a specific account owns.
     */
    getTokenBalance(query: AccountTokenBalanceQuery) {
        return this.get<AccountTokenBalanceResponse>(Module.Account, Object.assign({
            action: 'tokenbalance',
            tag: 'latest',
        }, query));
    }
    /**
     * Returns the balance of a sepcific account
     */
    getBalanceOfEth<T extends AccountBalanceQuery>({ address, tag }: T) {
        let action = 'balance';
        if (typeof address !== 'string' && address && address.length) {
            address = address.join(',');
            action = 'balancemulti';
        }

        return this.get<AccountBalanceResponse<T>>(Module.Account, Object.assign({
            action,
            address,
            tag: 'latest'
        }, { tag }));
    }
    /**
     * Get a list of internal transactions
     */
    getTxListInternal(query: AccountTxListInternalQuery) {
        return this.get<AccountTxListInternalResponse[]>(Module.Account, Object.assign({
            action: 'txlistinternal',
            startblock: 0,
            endblock: 'latest',
            sort: Sort.ASC
        }, query));
    }
    /**
     * Get a list of transactions for a specfic address
     */
    getTxList(query: AccountTxListQuery) {
        return this.get<AccountTxListResponse[]>(Module.Account, Object.assign({
            action: 'txlist',
            startblock: 0,
            endblock: 'latest',
            sort: Sort.ASC
        }, query));
    }
    /**
     * Get a list of blocks that a specific account has mineds
     */
    getMinedBlocks(query: AccountMineBlocksQuery) {
        return this.get<AccountMineBlocksResponse>(Module.Account, Object.assign({
            action: 'getminedblocks',
            blocktype: 'blocks',
        }, query));
    }
    /**
    * Get a list of "ERC20 - Token Transfer Events" by Address
    */
    getTokenERC20Txs(query: AccountERC20TokenTransferEventQuery) {
        return this.get<AccountERC20TokenTransferEventResponse>(Module.Account, Object.assign({
            action: 'tokentx',
            startblock: 0,
            endblock: 'latest',
            sort: Sort.ASC
        }, query));
    }

    /**
    * Get a list of "ERC721 - Token Transfer Events" by Address
    */
    getTokenERC721Txs(query: AccountERC721TokenTransferEventQuery) {
        return this.get<AccountERC721TokenTransferEventResponse>(Module.Account, Object.assign({
            action: 'tokennfttx',
            startblock: 0,
            endblock: 'latest',
            sort: Sort.ASC
        }, query));
    }
    /**
    * Get a list of "ERC1155 - Token Transfer Events" by Address
    */
    getTokenERC1155Txs(query: AccountERC1155TokenTransferEventQuery) {
        return this.get<AccountERC1155TokenTransferEventResponse>(Module.Account, Object.assign({
            action: 'tokennfttx',
            startblock: 0,
            endblock: 'latest',
            sort: Sort.ASC
        }, query));
    }
    /**
     * Gethistorical ether balance for a single address by blockNo.
     */
    getHistoryBalanceOfEth(query: AccountHistoryBalanceOfEthQuery) {
        return this.get<AccountHistoryBalanceOfEthResponse>(Module.Account, Object.assign({
            action: 'balancehistory'
        }, query));
    }
    /**
    * The Event Log API was designed to provide an alternative to the native eth_getLogs.
    */
    getLogs(query: GetLogsQuery) {
        return this.get<GetLogsResponse[]>(Module.Logs, Object.assign({
            action: 'getLogs',
            fromBlock: 0,
            toBlock: 'latest',
        }, query));
    }
    /**
    * Get the ABI 
    */
    getContractAbi(query: GetContractABIQuery) {
        return this.get<GetContractABIResponse>(Module.Contract, Object.assign({
            action: 'getabi',
        }, query));
    }
    /**
     * Get the contract source code 
     */
    getContractInfo(query: GetContractSourceCodeQuery) {
        return this.get<GetContractSourceCodeResponse[]>(Module.Contract, Object.assign({
            action: 'getsourcecode',
        }, query));
    }
    /**
     * Find the block reward for a given address and block
     */
    getBlockreward(query: BlockRewardQuery) {
        return this.get<BlockRewardResponse>(Module.Block, Object.assign({
            action: 'getblockreward',
        }, query));
    }
    /**
     * Find the block countdown for a given address and block
     */
    getBlockCountdown(query: BlockCountdownQuery) {
        return this.get<BlockCountdownResponse>(Module.Block, Object.assign({
            action: 'getblockcountdown',
        }, query));
    }
    /**
     * Find the block no for a given timestamp
     */
    getBlocknoByTime(query: BlockNoByTimestampQuery) {
        return this.get<BlockNoByTimestampResponse>(Module.Block, Object.assign({
            action: 'getblocknobytime',
        }, query));
    }

    getTxReceipt(hash: string) {
        return this.get<GetTxReceipt>(Module.Proxy, Object.assign({
            action: 'eth_getTransactionReceipt',
            txhash: hash
        }))
    }
}