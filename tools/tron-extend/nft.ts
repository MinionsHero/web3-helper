import axios from 'axios';
import TronWeb from 'tronweb'
import { AsyncArray } from '../async-array';
import { retry } from '../blockscan/helpers';
import { TRC721TokenResponse } from './types';



export async function queryTokenIdsOfOwner(trc721Addr: string, owner: string) {
    let pageSize = 50
    let sum: TRC721TokenResponse['data'] = []
    let data: TRC721TokenResponse['data']
    do {
        data = await retry(null, async () => {
            const res = await axios.get<TRC721TokenResponse>(`https://apilist.tronscanapi.com/api/trc721/token?contract=${trc721Addr}&limit=${pageSize}&start=${sum.length}&sort=-tokenId&ownerAddress=${owner}`)
            if (res.status === 200 || res.status === 304) {
                if (res.data.code === 200) {
                    return res.data.data
                }
                throw res.data.data
            }
            throw res.statusText
        })
        sum.push(...data)
    } while (data.length === pageSize)
    return sum.map(el => Number(el.token_id))
}

export async function tokenIdsOfOwner(tronWeb: TronWeb, trc721Addr: string, owner: string) {
    const contract = await tronWeb.contract().at(trc721Addr);
    const balance = await contract.balanceOf(owner).call();
    const balanceNumber = tronWeb.toDecimal(balance)
    if (balanceNumber <= 0) {
        return []
    }
    try {
        await contract.tokenOfOwnerByIndex(owner, 0).call();
        const tokenIds = await AsyncArray.fromWithOptions(new Array(balanceNumber).fill(''), { concurrency: 1 }).mapAsync(async (_, i) => {
            return await retry(i, async (index) => {
                let tokenId = await contract.tokenOfOwnerByIndex(
                    owner,
                    index
                ).call();
                console.log(trc721Addr, owner, tokenId)
                return tronWeb.toDecimal(tokenId)
            })
        })
        return tokenIds
    } catch (e) {
        const totalSupply = await contract.totalSupply().call()
        const totalSupplyNumber = tronWeb.toDecimal(totalSupply)
        const tokenIds: number[] = []
        let hasTokenByIndexMethod = true
        try {
            await contract.tokenByIndex(0).call()
        } catch (e) {
            hasTokenByIndexMethod = false
        }
        if (!hasTokenByIndexMethod) {
            try {
                const tokenId = 0
                const _owner: string = await retry(tokenId, async tokenId => contract.ownerOf(tokenId).call(), async (e, times) => {
                    return times <= 5
                })
                const base58 = tronWeb.address.fromHex(_owner)
                if (base58.toLowerCase() === owner.toLowerCase()) {
                    tokenIds.push(tokenId)
                    console.log(trc721Addr, owner, tokenId)
                } else {
                    console.warn(trc721Addr, owner, tokenId)
                }
            } catch (e) {

            }
        }
        for (let i = 0; i < totalSupplyNumber; i++) {
            let tokenId: number
            if (hasTokenByIndexMethod) {
                tokenId = await contract.tokenByIndex(i).call()
            } else {
                tokenId = i + 1
            }
            try {
                const _owner: string = await retry(tokenId, tokenId => contract.ownerOf(tokenId).call(), async (e, times) => {
                    if (e === 'REVERT opcode executed') {
                        return false
                    }
                    return true
                })
                const base58 = tronWeb.address.fromHex(_owner)
                if (base58.toLowerCase() === owner.toLowerCase()) {
                    tokenIds.push(tokenId)
                    console.log(trc721Addr, owner, tokenId)
                } else {
                    console.warn(trc721Addr, owner, tokenId)
                }
            } catch (e) {

            }
        }
        return tokenIds
    }
}