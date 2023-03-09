"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LowSync = void 0;
const MissingAdapterError_1 = require("./MissingAdapterError");
class LowSync {
    constructor(adapter) {
        this.data = null;
        if (adapter) {
            this.adapter = adapter;
        }
        else {
            throw new MissingAdapterError_1.MissingAdapterError();
        }
    }
    read() {
        this.data = this.adapter.read();
    }
    write() {
        if (this.data !== null) {
            this.adapter.write(this.data);
        }
    }
}
exports.LowSync = LowSync;
