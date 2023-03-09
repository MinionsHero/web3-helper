import TronWeb from 'tronweb'

// reference https://github.com/tronprotocol/documentation-en/blob/master/docs/developers/official-public-nodes.md
export const TronGridHosts = {
    Main: 'https://api.trongrid.io',
    Shasta: 'https://api.shasta.trongrid.io',
    Nile: 'https://nile.trongrid.io'
}

export function createTronWeb(network: keyof typeof TronGridHosts, privateKey: string, apiKey: string):TronWeb {
    const HttpProvider = TronWeb.providers.HttpProvider
    const nodeUrl = TronGridHosts[network]
    const fullNode = new HttpProvider(nodeUrl);
    const solidityNode = new HttpProvider(nodeUrl);
    const eventServer = new HttpProvider(nodeUrl);
    const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);
    if (apiKey) {
        //Only main net need to set api-key
        tronWeb.setHeader({ "TRON-PRO-API-KEY": apiKey });
    }
    return tronWeb
}
