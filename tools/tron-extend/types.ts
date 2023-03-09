/**
 * Copyright (c) iEXBase. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/// <reference types="node" />
// declare module 'tronweb' {

//     interface address {
//         fromHex: (e: string) => string;
//         fromPrivateKey: (e: string) => string;
//         toHex: (e: string) => string;
//     }

//     export class TronWeb {
//         constructor(e: any, r: any, ...args: any[]);
//         defaultPrivateKey: string;
//         address: address;
//         contract(...args: any[]): any;
//         currentProvider(): any;
//         currentProviders(): any;
//         getEventByTransactionID(transactionID: string, callback?: any): any;
//         getEventResult(...args: any[]): any;
//         isConnected(callback?: any): any;
//         isValidProvider(provider: any): any;
//         setAddress(address: any): void;
//         setDefaultBlock(blockID: any): any;
//         setEventServer(eventServer: any): any;
//         setFullNode(fullNode: any): void;
//         setPrivateKey(privateKey: any): void;
//         setSolidityNode(solidityNode: any): void;
//         createAccount(callback?: any): Promise<any>;
//         fromAscii(string: any, padding: any): any;
//         fromDecimal(value: any): any;
//         fromSun(sun: any): any;
//         fromUtf8(string: any): any;
//         isAddress(address: string): any;
//         sha3(string: any, prefix?: boolean): any;
//         toAscii(hex: any): any;
//         toBigNumber(amount: number): any;
//         toDecimal(value: any): number;
//         toHex(val: any): any;
//         toSun(trx: any): any;
//         toUtf8(hex: any): any;
//         setHeader(arg: Record<string, string>): any;
//         trx: {
//             parseToken(token: any): any;
//             getCurrentBlock(callback?: any): Promise<any>;
//             getBlock(block: any, callback?: any): Promise<any>;
//             getBlockByHash(blockHash: any, callback?: any): Promise<any>;
//             getBlockByNumber(blockID: any, callback?: any): Promise<any>;
//             getBlockTransactionCount(block: any, callback?: any): Promise<any>;
//             getTransactionFromBlock(block: any, index: number, callback?: any): Promise<any>;
//             getTransaction(transactionID: any, callback?: any): Promise<any>;
//             getConfirmedTransaction(transactionID: any, callback?: any): Promise<any>;
//             getTransactionInfo(transactionID: any, callback?: any): Promise<any>;
//             getTransactionsToAddress(address: any, limit: number, offset: number, callback?: any): Promise<any>;
//             getTransactionsFromAddress(address: any, limit: number, offset: number, callback?: any): Promise<any>;
//             getTransactionsRelated(address: any, direction: any, limit: number, offset: number, callback?: any): Promise<any>;
//             getAccount(address: any, callback?: any): Promise<any>;
//             getBalance(address: any, callback?: any): Promise<any>;
//             getUnconfirmedAccount(address: any, callback?: any): Promise<any>;
//             getUnconfirmedBalance(address: any, callback?: any): Promise<any>;
//             getBandwidth(address: any, callback?: any): Promise<any>;
//             getTokensIssuedByAddress(address: any, callback?: any): Promise<any>;
//             getTokenFromID(tokenID: any, callback?: any): Promise<any>;
//             listNodes(callback?: any): Promise<any>;
//             getBlockRange(start: number, end: number, callback?: any): Promise<any>;
//             listSuperRepresentatives(callback?: any): Promise<any>;
//             listTokens(limit?: number, offset?: number, callback?: any): Promise<any>;
//             timeUntilNextVoteCycle(callback?: any): Promise<any>;
//             getContract(contractAddress: any, callback?: any): Promise<any>;
//             verifyMessage(message: any, signature: any, address: any, useTronHeader: any, callback?: any): Promise<any>;
//             sign(transaction: any, privateKey: any, useTronHeader: boolean, callback?: any): Promise<any>;
//             sendRawTransaction(signedTransaction: any, options: any, callback?: any): Promise<any>;
//             sendTransaction(to: any, amount: any, options: any, callback?: any): Promise<any>;
//             sendToken(to: any, amount: any, tokenID: any, options: any, callback?: any): Promise<any>;
//             freezeBalance(amount: any, duration: number, resource: string, options: any, callback?: any): Promise<any>;
//             unfreezeBalance(resource: string, options: any, callback?: any): Promise<any>;
//             updateAccount(accountName: string, options: any, callback?: any): Promise<any>;
//             signMessage(...args: any[]): Promise<any>;
//             sendAsset(...args: any[]): Promise<any>;
//             send(...args: any[]): Promise<any>;
//             sendTrx(...args: any[]): Promise<any>;
//             broadcast(...args: any[]): Promise<any>;
//             signTransaction(...args: any[]): Promise<any>;
//             getProposal(proposalID: any, callback?: any): Promise<any>;
//             listProposals(callback: any): Promise<any>;
//             getChainParameters(callback: any): Promise<any>;
//             getAccountResources(address: any, callback?: any): Promise<any>;
//             getExchangeByID(exchangeID: any, callback?: any): Promise<any>;
//             listExchanges(callback?: any): Promise<any>;
//             listExchangesPaginated(limit: number, offset: number, callback?: any): Promise<any>;
//         }
//     }
//     export namespace TronWeb {


//         export namespace providers {
//             class HttpProvider {
//                 constructor(nodeUrl: string);
//             }
//         }


//         namespace transactionBuilder {
//             function sendTrx(to: any, amount: any, from: any, callback?: any): Promise<any>;
//             function sendToken(to: any, amount: any, tokenID: any, from: any, callback?: any): Promise<any>;
//             function purchaseToken(issuerAddress: any, tokenID: any, amount: any, buyer: any, callback?: any): Promise<any>;
//             function freezeBalance(amount: any, duration: number, resource: string, address: any, callback?: any): Promise<any>;
//             function unfreezeBalance(resource: string, address: any, callback?: any): Promise<any>;
//             function withdrawBlockRewards(address: any, callback?: any): Promise<any>;
//             function applyForSR(address: any, url: any, callback?: any): Promise<any>;
//             function vote(votes: any, voterAddress: any, callback?: any): Promise<any>;
//             function createToken(options: any, issuerAddress: any, callback?: any): Promise<any>;
//             function updateAccount(accountName: any, address: any, callback?: any): Promise<any>;
//             function updateToken(options: any, issuerAddress: any, callback?: any): Promise<any>;
//             function sendAsset(...args: any[]): Promise<any>;
//             function purchaseAsset(...args: any[]): Promise<any>;
//             function createAsset(...args: any[]): Promise<any>;
//             function updateAsset(...args: any[]): Promise<any>;
//             function createProposal(parameters: any, issuerAddress: any, callback?: any): Promise<any>;
//             function deleteProposal(proposalID: any, issuerAddress: any, callback?: any): Promise<any>;
//             function voteProposal(proposalID: any, isApproval: any, voterAddress: any, callback?: any): Promise<any>;
//             function createTRXExchange(tokenName: any, tokenBalance: any, trxBalance: any, ownerAddress: any): Promise<any>;
//             function createTokenExchange(firstTokenName: any, firstTokenBalance: any, secondTokenName: any, secondTokenBalance: any, ownerAddress: any, callback?: any): Promise<any>;
//             function injectExchangeTokens(exchangeID: any, tokenName: any, tokenAmount: any, ownerAddress: any, callback?: any): Promise<any>;
//             function withdrawExchangeTokens(exchangeID: any, tokenName: any, tokenAmount: any, ownerAddress: any, callback?: any): Promise<any>;
//             function tradeExchangeTokens(exchangeID: any, tokenName: any, tokenAmountSold: any, tokenAmountExpected: any, ownerAddress: any, callback?: any): Promise<any>;
//         }

//     }

//     export default TronWeb;
// }


// nft

export interface TRC721TokenResponse {
    "total": number,
    "rangeTotal": number,
    "page_size": number,
    "code": number,// 200:ok
    "data": {
        "token_id": string,
        "owner_address": string,// "TRXf7nriEhfRtJuzQ7iKosSd7PNWTFi1Ms"
        "owner_address_tag": string,
        "owner_address_tag_logo": string,
        "token_name": string,
        "token_description": string,
        "token_image": string,
        "token_url": string,
        "token_imageInnerUrl": string,
        "latest_transfer_timestamp": number,
        "transfer_count": number,
        "contract_address": string,// "TD5hi4Ut6h323sPnpH3Awe2deyn6mFV6Ab"
        "holders_count": number,
        "token_level": string,//"1"
        "icon_url": string,
        "issue_address": string,
        "symbol": string,
        "token_desc": string,
        "name": string,
        "issue_time": string,// "2022-03-28 09:48:06"
    }[]
}
