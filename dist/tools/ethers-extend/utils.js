"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.utils = void 0;
const ethers_1 = require("ethers");
exports.utils = {
    lowercaseAddress(addr) {
        return ethers_1.ethers.utils.getAddress(addr).toLowerCase();
    },
    isSameAddress(addr1, addr2) {
        return ethers_1.ethers.utils.getAddress(addr1) === ethers_1.ethers.utils.getAddress(addr2);
    }
};
