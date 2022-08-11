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
const p_map_1 = __importDefault(require("./p-map"));
class EndError extends Error {
}
function test(testFunction) {
    return function (element, index) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield testFunction(element, index);
            if (!result) {
                throw new EndError();
            }
            return result;
        });
    };
}
/**
Test whether *all* promises pass a testing function. Fulfills when *all* promises in `input` and ones returned from `testFunction` are fulfilled, or rejects if any of the promises reject.

@param input - Iterated over concurrently in the `testFunction` function.
@param testFunction - Predicate function, expected to return a `Promise<boolean>` or `boolean`.
@returns `true` if all promises passed the test and `false` otherwise.
 */
function pEvery(iterable, testFunction, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, p_map_1.default)(iterable, test(testFunction), opts);
            return true;
        }
        catch (error) {
            if (error instanceof EndError) {
                return false;
            }
            throw error;
        }
    });
}
exports.default = pEvery;
;
