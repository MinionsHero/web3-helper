import FileTool from '../fs';
import { BlockScan } from './blockscan';
import { AccountERC20TokenTransferEventQuery, AccountERC20TokenTransferEventResponse, AccountTxListQuery, AccountTxListResponse, ERC20, GetLogsQuery, GetLogsResponse, GetTxReceipt, TokenType } from './types';
import { ethers } from 'ethers';
import { JsonFragment } from '@ethersproject/abi';
export type ContractConfig = {
    address: string;
    sourcecode: string;
    mergedAbi: JsonFragment[];
    abi: JsonFragment[];
    bytecode: string;
    implementation: ContractConfig | null;
    contractName: string;
    constructorArguments: string;
    compilerVersion: string;
    optimizationUsed: string;
    runs: string;
    evmVersion: string;
    library: string;
    licenseType: string;
    proxy: string;
    swarmSource: string;
};
export declare class FastScan {
    private providers;
    private blockScans;
    private output;
    private offset;
    constructor(blockScans: BlockScan[], providers: ethers.providers.JsonRpcProvider[], output: string);
    dir(args: Record<string, any>): string;
    private _getNativeTokenERC20Txs;
    getNativeTokenERC20Txs(params: Omit<AccountERC20TokenTransferEventQuery, 'page' | 'offset'>): FileTool<AccountERC20TokenTransferEventResponse>;
    getTokenERC20Txs(params: Omit<AccountERC20TokenTransferEventQuery, 'page' | 'offset'>): Promise<FileTool<AccountERC20TokenTransferEventResponse>>;
    private _getNativeTxList;
    getNativeTxList(params: Omit<AccountTxListQuery, 'page' | 'offset'>): FileTool<AccountTxListResponse>;
    getNativeTxListDir(params: Omit<AccountTxListQuery, 'page' | 'offset'>): string;
    handleBlockScanError(e: Error): Promise<void>;
    getTxList(params: Omit<AccountTxListQuery, 'page' | 'offset'>): Promise<FileTool<AccountTxListResponse>>;
    private _getNativeLogs;
    getNativeLogsDir(params: Omit<GetLogsQuery, 'page' | 'offset'>): string;
    getNativeLogs(params: Omit<GetLogsQuery, 'page' | 'offset'>): FileTool<GetLogsResponse>;
    getLogs(params: Omit<GetLogsQuery, 'page' | 'offset'>, onDataReceived?: (data: GetLogsResponse[], file: FileTool<GetLogsResponse>) => void): Promise<FileTool<GetLogsResponse>>;
    getNativeTxReceiptsForLogs(params: Omit<GetLogsQuery, 'page' | 'offset'>): FileTool<GetTxReceipt>;
    getNativeTxReceiptsForTxs(params: Omit<AccountTxListQuery, 'page' | 'offset'>): FileTool<GetTxReceipt>;
    private getTxReceiptsForHash;
    getTxReceiptsForLogs(params: Omit<GetLogsQuery, 'page' | 'offset'>, onDataReceived?: (data: GetTxReceipt[], file: FileTool<GetTxReceipt>) => void): Promise<FileTool<GetTxReceipt>>;
    getTxReceiptsForTxs(params: Omit<AccountTxListQuery, 'page' | 'offset'>, onDataReceived?: (data: GetTxReceipt[], file: FileTool<GetTxReceipt>) => void): Promise<FileTool<GetTxReceipt>>;
    writeFile<T>(targetDir: string, filename: string, data: T): T;
    readFile<T>(targetDir: string, filename: string, fill: T): T;
    private parseContract;
    getContract(addr: string, mergedAbi: JsonFragment[], httpConfig: {
        provider: ethers.providers.JsonRpcProvider;
        blockScan: BlockScan;
    }): Promise<ContractConfig | null>;
    requestData<T, U>(data: T[], fn: (el: T, index: number, args: {
        provider: ethers.providers.JsonRpcProvider | null;
        blockScan: BlockScan | null;
    }) => Promise<U>, usage?: {
        provider?: boolean;
        blockScan?: boolean;
    }): Promise<U[]>;
    getContractsInfo(addrs: string[]): Promise<(ContractConfig | null)[]>;
    getTokenType(address: string, { provider, blockScan }: {
        provider: ethers.providers.JsonRpcProvider | null;
        blockScan: BlockScan | null;
    }): any;
    getContractsType(addrs: string[]): Promise<Record<string, TokenType>>;
    getERC20Params(address: string, provider: ethers.providers.JsonRpcProvider): Promise<{
        symbol: any;
        name: any;
        decimals: number;
    }>;
    getERC20ContractsParams(addrs: string[]): Promise<Record<string, ERC20>>;
}
