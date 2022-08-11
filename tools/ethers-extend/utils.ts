import { ethers } from 'ethers'

export const utils = {
    lowercaseAddress(addr: string) {
        return ethers.utils.getAddress(addr).toLowerCase()
    },
    isSameAddress(addr1: string, addr2: string) {
        return ethers.utils.getAddress(addr1) === ethers.utils.getAddress(addr2)
    }
}