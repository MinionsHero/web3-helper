import TronWeb from 'tronweb';
export declare const TronGridHosts: {
    Main: string;
    Shasta: string;
    Nile: string;
};
export declare function createTronWeb(network: keyof typeof TronGridHosts, privateKey: string, apiKey: string): TronWeb;
