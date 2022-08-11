import FileTool from '../fs';
import { BlockScan } from './blockscan'
import { multiQuery, sliceTask } from './helpers'
import { AccountTxListQuery, AccountTxListResponse, ERC20, GetContractSourceCodeResponse, GetLogsQuery, GetLogsResponse, GetTxReceipt, Sort, TokenType } from './types';
import path from 'path'
import { BigNumber, ethers } from 'ethers';
import { debounce, uniqBy } from 'lodash';
import fs from 'fs-extra'
import { JsonFragment } from '@ethersproject/abi'
import delay from 'delay'
import IERC165 from '../../abis/IERC165.json'
import IERC20 from '../../abis/IERC20.json'
import { EVM } from 'evm';

export type ContractConfig = {
    address: string,
    sourcecode: string,
    mergedAbi: JsonFragment[],
    abi: JsonFragment[],
    bytecode: string,
    implementation: ContractConfig | null,
    contractName: string,
    constructorArguments: string,
    compilerVersion: string,
    optimizationUsed: string,
    runs: string,
    evmVersion: string,
    library: string,
    licenseType: string,
    proxy: string,
    swarmSource: string
}

const erc20Functions = [
    'name()',
    'approve(address,uint256)',
    'totalSupply()',
    'decimals()',
    'balanceOf(address)',
    'symbol()',
    'transfer(address,uint256)',
    'allowance(address,address)'
]


export class FastScan {

    private providers: ethers.providers.JsonRpcProvider[]
    private blockScans: BlockScan[]
    private output: string
    private offset = 100

    constructor(blockScans: BlockScan[], providers: ethers.providers.JsonRpcProvider[], output: string) {
        if (blockScans.length > 100) {
            throw new Error('apiKey count should be less then 100')
        }
        this.blockScans = blockScans
        if (providers.length === 0) {
            throw new Error('provider count should be greater than 0')
        }
        this.providers = providers
        this.output = output
    }

    public dir(args: Record<string, any>) {
        return path.resolve(this.output, Object.values(args).join('-')).toLowerCase()
    }

    private _getNativeTxList(params: Omit<AccountTxListQuery, 'page' | 'offset'>) {
        const offset = this.offset
        const args = Object.assign({
            action: 'txlist',
            startblock: 0,
            endblock: 'latest',
            sort: Sort.ASC
        }, params)
        const file = new FileTool<AccountTxListResponse>(this.dir(args), { offset })
        return { file, args }
    }

    getNativeTxList(params: Omit<AccountTxListQuery, 'page' | 'offset'>) {
        return this._getNativeTxList(params).file
    }

    getNativeTxListDir(params: Omit<AccountTxListQuery, 'page' | 'offset'>) {
        return this.dir(this._getNativeTxList(params).args)
    }

    async handleBlockScanError(e: Error) {
        debugger
    }

    async getTxList(params: Omit<AccountTxListQuery, 'page' | 'offset'>) {
        const { file, args } = this._getNativeTxList(params)
        await multiQuery({
            elments: this.blockScans,
            keys: {
                from: 'startblock',
                to: 'endblock'
            },
            query: args,
            breakpoint: (tx) => Number(tx.blockNumber),
            uniqWith: (a, b) => a.hash === b.hash,
            request: async (query, qs, i) => {
                return await query.getTxList(Object.assign({ page: i + 1, offset: this.offset }, qs))
            },
            prevData: file.tailData(10000),
            cache: async (data) => {
                file.append(data)
            }
        })
        return file
    }

    private _getNativeLogs(params: Omit<GetLogsQuery, 'page' | 'offset'>) {
        const offset = this.offset
        const args: Omit<GetLogsQuery, 'page' | 'offset'> & { sort?: Sort } = Object.assign({
            action: 'getLogs',
            fromBlock: 0,
            toBlock: 'latest',
        }, params)
        const file = new FileTool<GetLogsResponse>(this.dir(args), { offset })
        return { file, args }
    }

    getNativeLogsDir(params: Omit<GetLogsQuery, 'page' | 'offset'>) {
        return this.dir(this._getNativeLogs(params).args)
    }

    getNativeLogs(params: Omit<GetLogsQuery, 'page' | 'offset'>) {
        return this._getNativeLogs(params).file
    }

    async getLogs(params: Omit<GetLogsQuery, 'page' | 'offset'>, onDataReceived?: (data: GetLogsResponse[], file: FileTool<GetLogsResponse>) => void) {
        const { file, args } = this._getNativeLogs(params)
        await multiQuery({
            elments: this.blockScans,
            keys: {
                from: 'fromBlock',
                to: 'toBlock'
            },
            query: args,
            breakpoint: (log) => Number(log.blockNumber),
            uniqWith: (a, b) => {
                return a.transactionIndex === b.transactionIndex && a.logIndex === b.logIndex && a.blockNumber === b.blockNumber
            },
            request: async (query, qs, i) => {
                return await query.getLogs(Object.assign({ page: i + 1, offset: this.offset }, qs))
            },
            prevData: file.tailData(10000),
            cache: async (data) => {
                file.append(data)
                onDataReceived && onDataReceived(data, file)
            }
        })
        return file
    }

    getNativeTxReceiptsForLogs(params: Omit<GetLogsQuery, 'page' | 'offset'>) {
        const { args } = this._getNativeLogs(params)
        const receiptFt = new FileTool<GetTxReceipt>(this.dir(Object.assign(args, { receipts: 'receipts' })), { offset: this.offset })
        return receiptFt
    }

    getNativeTxReceiptsForTxs(params: Omit<AccountTxListQuery, 'page' | 'offset'>) {
        const { args } = this._getNativeTxList(params)
        const receiptFt = new FileTool<GetTxReceipt>(this.dir(Object.assign(args, { receipts: 'receipts' })), { offset: this.offset })
        return receiptFt
    }

    private async getTxReceiptsForHash<T>(file: FileTool<T>, args: Record<string, any>, hashPropName: string, onDataReceived?: (data: GetTxReceipt[], file: FileTool<GetTxReceipt>) => void) {
        const receiptFt = new FileTool<GetTxReceipt>(this.dir(Object.assign(args, { receipts: 'receipts' })), { offset: this.offset })
        const next = file.read(receiptFt.length)
        let data: T[] | null
        const lastPageData = receiptFt.readLastPageData()
        const cache: Record<string, GetTxReceipt> = lastPageData ? lastPageData.reduce((prev, cur) => {
            prev[cur.transactionHash] = cur
            return prev
        }, {} as Record<string, GetTxReceipt>) : {}
        const providers = [
            ...this.providers,
        ]
        const blockScans = [
            ...this.blockScans,
        ]
        while (data = next()) {
            const uniqHashData: string[] = uniqBy(data, el => el[hashPropName]).map(el => el[hashPropName])
            let clearIds: NodeJS.Timeout[] = []
            const fetchByProvider = (provider: ethers.providers.JsonRpcProvider, hash: string) => {
                return new Promise<GetTxReceipt>((resolve, reject) => {
                    provider.send('eth_getTransactionReceipt', [hash]).then(resolve).catch((e) => {
                        if (ethers.utils.Logger.errors.TIMEOUT === e.code) {
                            console.log(`fetch by etherscan: ${hash}`)
                            const blockScan = blockScans.shift()
                            if (blockScan) {
                                blockScans.push(blockScan)
                                blockScan.getTxReceipt(hash).then(resolve).catch((e) => {
                                    console.log(e)
                                    if (e.message === 'Max rate limit reached') {
                                        const index = blockScans.findIndex(b => b.apiKey === blockScan.apiKey)
                                        if (index > -1) {
                                            blockScans.splice(index, 1)
                                        }
                                    }
                                    reject(e)
                                })
                            } else {
                                reject(new Error(`fetch timeout with provider ${hash}`))
                            }
                        } else {
                            reject(e)
                        }
                    })
                })
            }
            await sliceTask(uniqHashData, providers.length, async ({ el: hash, index }) => {
                const provider = providers.shift()
                if (provider) {
                    providers.push(provider)
                    if (!cache[hash]) {
                        try {
                            cache[hash] = await fetchByProvider(provider, hash)
                        } catch (e) {
                            console.error(e)
                            throw e
                        }
                    }
                    if (!cache[hash]) {
                        debugger
                        console.error(`receipt is null for ${hash}`)
                        throw new Error(`receipt is null for ${hash}`)
                    }
                    return cache[hash]
                }
                throw new Error('provider is null')
            }, 200)
            clearIds.forEach(id => clearTimeout(id))
            const dataToWrite = data.map(el => cache[el[hashPropName]])
            receiptFt.append(dataToWrite)
            onDataReceived && onDataReceived(dataToWrite, receiptFt)
        }
        return receiptFt
    }

    async getTxReceiptsForLogs(params: Omit<GetLogsQuery, 'page' | 'offset'>, onDataReceived?: (data: GetTxReceipt[], file: FileTool<GetTxReceipt>) => void) {
        const { file, args } = this._getNativeLogs(params)
        return await this.getTxReceiptsForHash(file, args, 'transactionHash', onDataReceived)
    }

    async getTxReceiptsForTxs(params: Omit<AccountTxListQuery, 'page' | 'offset'>, onDataReceived?: (data: GetTxReceipt[], file: FileTool<GetTxReceipt>) => void) {
        const { file, args } = this._getNativeTxList(params)
        return await this.getTxReceiptsForHash(file, args, 'hash', onDataReceived)
    }


    public writeFile<T>(targetDir: string, filename: string, data: T) {
        fs.ensureDirSync(targetDir)
        const file = path.resolve(targetDir, filename)
        filename.endsWith('json') ? fs.writeJsonSync(file, data) : fs.writeFileSync(file, data as any as string)
        return data
    }

    public readFile<T>(targetDir: string, filename: string, fill: T) {
        const file = path.resolve(targetDir, filename)
        if (fs.existsSync(file)) {
            return (filename.endsWith('json') ? fs.readJsonSync(file) : fs.readFileSync(file)) as T
        }
        return fill
    }

    private async parseContract(address: string, code: GetContractSourceCodeResponse & { Bytecode: string }, mergedAbi: JsonFragment[], httpConfig: { provider: ethers.providers.JsonRpcProvider, blockScan: BlockScan }): Promise<ContractConfig | null> {
        let abi: JsonFragment[] = []
        if (code.ABI !== 'Contract source code not verified' && code.ABI) {
            try {
                abi = JSON.parse(code.ABI)
            } catch (e) {
                console.error(e, address)
            }
        }
        let toMerged = [...abi]
        const index = toMerged.findIndex(el => el.type === 'constructor')
        if (index > -1) {
            toMerged.splice(index, 1)
        }
        mergedAbi.push(...toMerged)
        let sourcecode = code.SourceCode
        let temp = sourcecode.trim()
        if (temp.startsWith('{{') && temp.endsWith('}}')) {
            temp = temp.slice(1, -1)
            try {
                const sourceConfig = JSON.parse(temp);
                sourcecode = Object.keys(sourceConfig.sources).reduce((prev, cur) => {
                    const val = sourceConfig.sources[cur]
                    if (val.content) {
                        return `${prev}${'//  ' + cur}\r\n${val.content}\r\n`
                    }
                    return prev
                }, '')
            } catch (e) {
                console.log(e, address)
            }
        }
        let implementation: ContractConfig | null = null
        // implemention === address 会出现循环请求
        if (code.Implementation && ethers.utils.isAddress(code.Implementation) && ethers.utils.getAddress(code.Implementation).toLowerCase() !== ethers.utils.getAddress(address).toLowerCase()) {
            implementation = await this.getContract(code.Implementation, mergedAbi, httpConfig)
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
        }
    }

    public async getContract(addr: string, mergedAbi: JsonFragment[], httpConfig: { provider: ethers.providers.JsonRpcProvider, blockScan: BlockScan }): Promise<ContractConfig | null> {
        const address = ethers.utils.getAddress(addr).toLowerCase()
        const dir = this.dir({ contracts: 'contracts' })
        const { provider, blockScan } = httpConfig
        const filename = `${address}.json`
        const file = this.readFile<(GetContractSourceCodeResponse & { Bytecode: string })[] | null>(dir, filename, null)
        if (file) {
            if (file.length !== 1) {
                throw new Error(`${address} contract config length > 1`)
            }
            const code = file[0]
            return await this.parseContract(address, code, mergedAbi, httpConfig)
        }
        const bytecode = await provider.getCode(address)
        if (bytecode === '0x') {
            return null
        }
        const info = await blockScan.getContractInfo({ address })
        if (info.length !== 1) {
            throw new Error(`${address} contract config length > 1`)
        }
        const code = { ...info[0], Bytecode: bytecode }
        let implementation = code.Implementation
        if (!implementation) {
            const slot = await provider.getStorageAt(address, '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc')
            const implementionSlot = ethers.utils.hexStripZeros(slot)
            if (implementionSlot !== '0x') {
                code.Implementation = implementionSlot
            }
        }
        this.writeFile<(GetContractSourceCodeResponse & { Bytecode: string })[] | null>(dir, filename, [code])
        return await this.parseContract(address, code, mergedAbi, httpConfig)
    }

    public async requestData<T, U>(data: T[], fn: (el: T, index: number, args: { provider: ethers.providers.JsonRpcProvider | null, blockScan: BlockScan | null }) => Promise<U>, usage: { provider?: boolean, blockScan?: boolean } = { provider: true, blockScan: true }) {
        const providers = usage.provider ? [...this.providers] : []
        const blockScans = usage.blockScan ? [...this.blockScans] : []
        const length = usage.provider && usage.blockScan ? Math.min(blockScans.length, providers.length) : usage.provider ? providers.length : usage.blockScan ? blockScans.length : 0
        if (length === 0) {
            throw new Error('provider or blockScan is required.')
        }
        return await sliceTask<T, U>(data, length, async ({ el, index }) => {
            const provider = usage.provider && providers.shift() || null
            if (provider) {
                providers.push(provider)
            }
            const blockScan = usage.blockScan && blockScans.shift() || null
            if (blockScan) {
                blockScans.push(blockScan)
            }
            return await fn(el, index, { provider, blockScan })
        })
    }

    public async getContractsInfo(addrs: string[]): Promise<(ContractConfig | null)[]> {
        const dir = this.dir({ contracts: 'contracts' })
        const providers = [...this.providers]
        const blockScans = [...this.blockScans]
        const eoaFileName = '0x000000000000000000000000000000000000000-eoa.json'
        const eoaAddrs = this.readFile<string[]>(dir, eoaFileName, [])
        const fn = async ({ el, index }: { el: string, index: number }) => {
            const address = ethers.utils.getAddress(el).toLowerCase()
            if (eoaAddrs.find(el => el === address)) {
                return null
            }
            const provider = providers.shift()
            if (provider) {
                providers.push(provider)
                const blockScan = blockScans.shift()
                if (blockScan) {
                    blockScans.push(blockScan)
                    try {
                        const contract = await this.getContract(address, [], { provider, blockScan })
                        if (!contract) {
                            eoaAddrs.push(address)
                            this.writeFile(dir, eoaFileName, eoaAddrs)
                        }
                        return contract
                    } catch (error) {
                        const e = error as Error
                        console.log(e)
                        if (e.message === 'Max rate limit reached') {
                            const index = blockScans.findIndex(b => b.apiKey === blockScan.apiKey)
                            if (index > -1) {
                                blockScans.splice(index, 1)
                            }
                        }
                        throw error
                    }
                } else {
                    await delay(500)
                    return await fn({ el, index })
                }
            } else {
                await delay(500)
                return await fn({ el, index })
            }
        }
        return await sliceTask(addrs, Math.min(blockScans.length, providers.length), fn)
    }

    async getTokenType(address: string, { provider, blockScan }: { provider: ethers.providers.JsonRpcProvider | null; blockScan: BlockScan | null; }) {
        if (provider && blockScan) {
            try {
                const contract = new ethers.Contract(address, IERC165, provider)
                const isERC1155 = await contract.supportsInterface(0xd9b67a26)
                if (isERC1155) {
                    return TokenType.ERC1155
                }
                const isERC721 = await contract.supportsInterface(0x80ac58cd)
                if (isERC721) {
                    return TokenType.ERC721
                }
            } catch (e) {
            }
            try {
                const contractConfig = await this.getContract(address, [], { provider, blockScan })
                if (contractConfig) {
                    if (contractConfig.mergedAbi.length > 0) {
                        const interf = new ethers.utils.Interface(contractConfig.mergedAbi)
                        const fragments = interf.fragments.map(fragment => {
                            try {
                                return fragment.format()
                            } catch (e) {
                                return null
                            }
                        })
                        if (erc20Functions.every(f => !!fragments.find(fn => fn === f))) {
                            return TokenType.ERC20
                        }
                    }
                    const evm = new EVM(contractConfig.bytecode);
                    const functions = evm.getFunctions()
                    if (erc20Functions.every(f => !!functions.find(fn => fn.toLowerCase() === f.toLowerCase()))) {
                        return TokenType.ERC20
                    }
                }
            } catch (e) {
                console.error(e)
                throw e
            }
            try {
                const contract = new ethers.Contract(address, IERC20, provider)
                const symbol = await contract.symbol()
                const decimals = await contract.decimals()
                const name = await contract.name()
                const totalSupply = await contract.totalSupply()
                const balanceOf = await contract.balanceOf('0x25677E84Be364E0eEAc283baaAa27fFcE6081397')
                const allowance = await contract.allowance('0x25677E84Be364E0eEAc283baaAa27fFcE6081397', '0x0fcc024Ec8F8B038270AABFEfc13EE326eB5c39a')
                return TokenType.ERC20
            } catch (e) {
                return TokenType.NONE
            }
        }
        await delay(200)
        return await this.getTokenType(address, { provider, blockScan })
    }

    async getContractsType(addrs: string[]): Promise<Record<string, TokenType>> {
        const file = this.readFile<Record<string, TokenType>>(this.dir({ tokens: 'tokens' }), 'types.json', {})
        await this.requestData(addrs.map(el => el.toLowerCase()), async (address, _, { provider, blockScan }) => {
            if (file[address]) {
                return file[address]
            }
            const tokenType = await this.getTokenType(address, { provider, blockScan })
            file[address] = tokenType
            this.writeFile<Record<string, TokenType>>(this.dir({ tokens: 'tokens' }), 'types.json', file)
            return tokenType
        })
        return file
    }

    async getERC20Params(address: string, provider: ethers.providers.JsonRpcProvider) {
        const contract = new ethers.Contract(address, IERC20, provider)
        const symbol = await contract.symbol()
        const name = await contract.name()
        const decimals = await contract.decimals()
        return { symbol, name, decimals: BigNumber.from(decimals).toNumber() }
    }

    async getERC20ContractsParams(addrs: string[]) {
        const file = this.readFile<Record<string, ERC20>>(this.dir({ tokens: 'tokens' }), 'erc20.json', {})
        await this.requestData(addrs.map(el => el.toLowerCase()), async (address, _, { provider }) => {
            if (file[address]) {
                return file[address]
            }
            if (!provider) {
                await delay(200)
                throw new Error('no provider')
            }
            try {
                const tokenType = await this.getERC20Params(address, provider)
                file[address] = tokenType
                this.writeFile<Record<string, ERC20>>(this.dir({ tokens: 'tokens' }), 'erc20.json', file)
            } catch (e) {
                console.error(`${address} is not erc20.`)
            }
        }, { blockScan: false, provider: true })
        return file
    }

}