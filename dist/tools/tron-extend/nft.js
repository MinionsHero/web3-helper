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
exports.tokenIdsOfOwner = exports.queryTokenIdsOfOwner = void 0;
const axios_1 = __importDefault(require("axios"));
const async_array_1 = require("../async-array");
const helpers_1 = require("../blockscan/helpers");
function queryTokenIdsOfOwner(trc721Addr, owner) {
    return __awaiter(this, void 0, void 0, function* () {
        let pageSize = 50;
        let sum = [];
        let data;
        do {
            data = yield (0, helpers_1.retry)(null, () => __awaiter(this, void 0, void 0, function* () {
                const res = yield axios_1.default.get(`https://apilist.tronscanapi.com/api/trc721/token?contract=${trc721Addr}&limit=${pageSize}&start=${sum.length}&sort=-tokenId&ownerAddress=${owner}`);
                if (res.status === 200 || res.status === 304) {
                    if (res.data.code === 200) {
                        return res.data.data;
                    }
                    throw res.data.data;
                }
                throw res.statusText;
            }));
            sum.push(...data);
        } while (data.length === pageSize);
        return sum.map(el => Number(el.token_id));
    });
}
exports.queryTokenIdsOfOwner = queryTokenIdsOfOwner;
function tokenIdsOfOwner(tronWeb, trc721Addr, owner) {
    return __awaiter(this, void 0, void 0, function* () {
        const contract = yield tronWeb.contract().at(trc721Addr);
        const balance = yield contract.balanceOf(owner).call();
        const balanceNumber = tronWeb.toDecimal(balance);
        if (balanceNumber <= 0) {
            return [];
        }
        try {
            yield contract.tokenOfOwnerByIndex(owner, 0).call();
            const tokenIds = yield async_array_1.AsyncArray.fromWithOptions(new Array(balanceNumber).fill(''), { concurrency: 1 }).mapAsync((_, i) => __awaiter(this, void 0, void 0, function* () {
                return yield (0, helpers_1.retry)(i, (index) => __awaiter(this, void 0, void 0, function* () {
                    let tokenId = yield contract.tokenOfOwnerByIndex(owner, index).call();
                    console.log(trc721Addr, owner, tokenId);
                    return tronWeb.toDecimal(tokenId);
                }));
            }));
            return tokenIds;
        }
        catch (e) {
            const totalSupply = yield contract.totalSupply().call();
            const totalSupplyNumber = tronWeb.toDecimal(totalSupply);
            const tokenIds = [];
            let hasTokenByIndexMethod = true;
            try {
                yield contract.tokenByIndex(0).call();
            }
            catch (e) {
                hasTokenByIndexMethod = false;
            }
            if (!hasTokenByIndexMethod) {
                try {
                    const tokenId = 0;
                    const _owner = yield (0, helpers_1.retry)(tokenId, (tokenId) => __awaiter(this, void 0, void 0, function* () { return contract.ownerOf(tokenId).call(); }), (e, times) => __awaiter(this, void 0, void 0, function* () {
                        return times <= 5;
                    }));
                    const base58 = tronWeb.address.fromHex(_owner);
                    if (base58.toLowerCase() === owner.toLowerCase()) {
                        tokenIds.push(tokenId);
                        console.log(trc721Addr, owner, tokenId);
                    }
                    else {
                        console.warn(trc721Addr, owner, tokenId);
                    }
                }
                catch (e) {
                }
            }
            for (let i = 0; i < totalSupplyNumber; i++) {
                let tokenId;
                if (hasTokenByIndexMethod) {
                    tokenId = yield contract.tokenByIndex(i).call();
                }
                else {
                    tokenId = i + 1;
                }
                try {
                    const _owner = yield (0, helpers_1.retry)(tokenId, tokenId => contract.ownerOf(tokenId).call(), (e, times) => __awaiter(this, void 0, void 0, function* () {
                        if (e === 'REVERT opcode executed') {
                            return false;
                        }
                        return true;
                    }));
                    const base58 = tronWeb.address.fromHex(_owner);
                    if (base58.toLowerCase() === owner.toLowerCase()) {
                        tokenIds.push(tokenId);
                        console.log(trc721Addr, owner, tokenId);
                    }
                    else {
                        console.warn(trc721Addr, owner, tokenId);
                    }
                }
                catch (e) {
                }
            }
            return tokenIds;
        }
    });
}
exports.tokenIdsOfOwner = tokenIdsOfOwner;
