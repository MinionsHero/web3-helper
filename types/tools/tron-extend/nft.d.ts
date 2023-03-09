import TronWeb from 'tronweb';
export declare function queryTokenIdsOfOwner(trc721Addr: string, owner: string): Promise<number[]>;
export declare function tokenIdsOfOwner(tronWeb: TronWeb, trc721Addr: string, owner: string): Promise<any[]>;
