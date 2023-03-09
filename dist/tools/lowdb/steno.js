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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _Writer_instances, _Writer_filename, _Writer_tempFilename, _Writer_locked, _Writer_prev, _Writer_next, _Writer_nextPromise, _Writer_nextData, _Writer_add, _Writer_write;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Writer = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Returns a temporary file
// Example: for /some/file will return /some/.file.tmp
function getTempFilename(file) {
    return path_1.default.join(path_1.default.dirname(file), '.' + path_1.default.basename(file) + '.tmp');
}
class Writer {
    constructor(filename) {
        _Writer_instances.add(this);
        _Writer_filename.set(this, void 0);
        _Writer_tempFilename.set(this, void 0);
        _Writer_locked.set(this, false);
        _Writer_prev.set(this, null);
        _Writer_next.set(this, null);
        _Writer_nextPromise.set(this, null);
        _Writer_nextData.set(this, null
        // File is locked, add data for later
        );
        __classPrivateFieldSet(this, _Writer_filename, filename, "f");
        __classPrivateFieldSet(this, _Writer_tempFilename, getTempFilename(filename), "f");
    }
    write(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return __classPrivateFieldGet(this, _Writer_locked, "f") ? __classPrivateFieldGet(this, _Writer_instances, "m", _Writer_add).call(this, data) : __classPrivateFieldGet(this, _Writer_instances, "m", _Writer_write).call(this, data);
        });
    }
}
exports.Writer = Writer;
_Writer_filename = new WeakMap(), _Writer_tempFilename = new WeakMap(), _Writer_locked = new WeakMap(), _Writer_prev = new WeakMap(), _Writer_next = new WeakMap(), _Writer_nextPromise = new WeakMap(), _Writer_nextData = new WeakMap(), _Writer_instances = new WeakSet(), _Writer_add = function _Writer_add(data) {
    // Only keep most recent data
    __classPrivateFieldSet(this, _Writer_nextData, data, "f");
    // Create a singleton promise to resolve all next promises once next data is written
    __classPrivateFieldSet(this, _Writer_nextPromise, __classPrivateFieldGet(this, _Writer_nextPromise, "f") || new Promise((resolve, reject) => {
        __classPrivateFieldSet(this, _Writer_next, [resolve, reject], "f");
    }), "f");
    // Return a promise that will resolve at the same time as next promise
    return new Promise((resolve, reject) => {
        var _a;
        (_a = __classPrivateFieldGet(this, _Writer_nextPromise, "f")) === null || _a === void 0 ? void 0 : _a.then(resolve).catch(reject);
    });
}, _Writer_write = function _Writer_write(data) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        // Lock file
        __classPrivateFieldSet(this, _Writer_locked, true, "f");
        try {
            // Atomic write
            yield fs_1.default.promises.writeFile(__classPrivateFieldGet(this, _Writer_tempFilename, "f"), data, 'utf-8');
            yield fs_1.default.promises.rename(__classPrivateFieldGet(this, _Writer_tempFilename, "f"), __classPrivateFieldGet(this, _Writer_filename, "f"));
            // Call resolve
            (_a = __classPrivateFieldGet(this, _Writer_prev, "f")) === null || _a === void 0 ? void 0 : _a[0]();
        }
        catch (err) {
            // Call reject
            (_b = __classPrivateFieldGet(this, _Writer_prev, "f")) === null || _b === void 0 ? void 0 : _b[1](err);
            throw err;
        }
        finally {
            // Unlock file
            __classPrivateFieldSet(this, _Writer_locked, false, "f");
            __classPrivateFieldSet(this, _Writer_prev, __classPrivateFieldGet(this, _Writer_next, "f"), "f");
            __classPrivateFieldSet(this, _Writer_next, __classPrivateFieldSet(this, _Writer_nextPromise, null, "f"), "f");
            if (__classPrivateFieldGet(this, _Writer_nextData, "f") !== null) {
                const nextData = __classPrivateFieldGet(this, _Writer_nextData, "f");
                __classPrivateFieldSet(this, _Writer_nextData, null, "f");
                yield this.write(nextData);
            }
        }
    });
};
