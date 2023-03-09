"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTronWeb = exports.TronGridHosts = void 0;
const tronweb_1 = __importDefault(require("tronweb"));
// reference https://github.com/tronprotocol/documentation-en/blob/master/docs/developers/official-public-nodes.md
exports.TronGridHosts = {
    Main: 'https://api.trongrid.io',
    Shasta: 'https://api.shasta.trongrid.io',
    Nile: 'https://nile.trongrid.io'
};
function createTronWeb(network, privateKey, apiKey) {
    const HttpProvider = tronweb_1.default.providers.HttpProvider;
    const nodeUrl = exports.TronGridHosts[network];
    const fullNode = new HttpProvider(nodeUrl);
    const solidityNode = new HttpProvider(nodeUrl);
    const eventServer = new HttpProvider(nodeUrl);
    const tronWeb = new tronweb_1.default(fullNode, solidityNode, eventServer, privateKey);
    if (apiKey) {
        //Only main net need to set api-key
        tronWeb.setHeader({ "TRON-PRO-API-KEY": apiKey });
    }
    return tronWeb;
}
exports.createTronWeb = createTronWeb;
