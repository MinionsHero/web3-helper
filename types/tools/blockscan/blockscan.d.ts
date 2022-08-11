import { AccountTxListInternalResponse, AccountBalanceQuery, AccountBalanceResponse, AccountTokenBalanceQuery, AccountTxListInternalQuery, AccountTxListQuery, AccountMineBlocksQuery, AccountERC20TokenTransferEventQuery, AccountERC721TokenTransferEventQuery, AccountERC1155TokenTransferEventQuery, AccountMineBlocksResponse, AccountERC20TokenTransferEventResponse, AccountERC721TokenTransferEventResponse, AccountERC1155TokenTransferEventResponse, AccountHistoryBalanceOfEthQuery, GetLogsQuery, GetLogsResponse, GetContractABIQuery, GetContractABIResponse, GetContractSourceCodeQuery, GetContractSourceCodeResponse, BlockCountdownQuery, BlockCountdownResponse, BlockNoByTimestampQuery, BlockRewardQuery, BlockRewardResponse, AccountTxListResponse, GetTxReceipt } from './types';
export declare class BlockScan {
    apiKey: string;
    private baseURL;
    private timeout;
    private httpsAgent;
    constructor(baseURL: string, apiKey: string, timeout?: number, httpsAgent?: any);
    static query(baseURL: string, apiKey: string): BlockScan;
    setApiKey(): void;
    private get;
    /**
     * Returns the amount of Tokens a specific account owns.
     */
    getTokenBalance(query: AccountTokenBalanceQuery): Promise<string>;
    /**
     * Returns the balance of a sepcific account
     */
    getBalanceOfEth<T extends AccountBalanceQuery>({ address, tag }: T): Promise<AccountBalanceResponse<T>>;
    /**
     * Get a list of internal transactions
     */
    getTxListInternal(query: AccountTxListInternalQuery): Promise<AccountTxListInternalResponse[]>;
    /**
     * Get a list of transactions for a specfic address
     */
    getTxList(query: AccountTxListQuery): Promise<AccountTxListResponse[]>;
    /**
     * Get a list of blocks that a specific account has mineds
     */
    getMinedBlocks(query: AccountMineBlocksQuery): Promise<AccountMineBlocksResponse>;
    /**
    * Get a list of "ERC20 - Token Transfer Events" by Address
    */
    getTokenERC20Txs(query: AccountERC20TokenTransferEventQuery): Promise<AccountERC20TokenTransferEventResponse>;
    /**
    * Get a list of "ERC721 - Token Transfer Events" by Address
    */
    getTokenERC721Txs(query: AccountERC721TokenTransferEventQuery): Promise<AccountERC721TokenTransferEventResponse>;
    /**
    * Get a list of "ERC1155 - Token Transfer Events" by Address
    */
    getTokenERC1155Txs(query: AccountERC1155TokenTransferEventQuery): Promise<AccountERC1155TokenTransferEventResponse>;
    /**
     * Gethistorical ether balance for a single address by blockNo.
     */
    getHistoryBalanceOfEth(query: AccountHistoryBalanceOfEthQuery): Promise<string>;
    /**
    * The Event Log API was designed to provide an alternative to the native eth_getLogs.
    */
    getLogs(query: GetLogsQuery): Promise<GetLogsResponse[]>;
    /**
    * Get the ABI
    */
    getContractAbi(query: GetContractABIQuery): Promise<GetContractABIResponse>;
    /**
     * Get the contract source code
     */
    getContractInfo(query: GetContractSourceCodeQuery): Promise<GetContractSourceCodeResponse[]>;
    /**
     * Find the block reward for a given address and block
     */
    getBlockreward(query: BlockRewardQuery): Promise<BlockRewardResponse>;
    /**
     * Find the block countdown for a given address and block
     */
    getBlockCountdown(query: BlockCountdownQuery): Promise<BlockCountdownResponse>;
    /**
     * Find the block no for a given timestamp
     */
    getBlocknoByTime(query: BlockNoByTimestampQuery): Promise<string>;
    getTxReceipt(hash: string): Promise<GetTxReceipt>;
}
