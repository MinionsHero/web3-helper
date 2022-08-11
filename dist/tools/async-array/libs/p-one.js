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
            const value = yield testFunction(element, index);
            if (value) {
                throw new EndError();
            }
            return value;
        });
    };
}
/**
Test whether *some* promise passes a testing function. Fulfills when *any* promise in `input` and ones returned from `testFunction` are fulfilled, or rejects if any of the promises reject.

@param input - Iterated over concurrently in the `testFunction` function.
@param testFunction - Predicate function, expected to return a `Promise<boolean>` or `boolean`.
@returns `true` if any promise passed the test and `false` otherwise.
*/
function pOne(iterable, testFunction, options) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, p_map_1.default)(iterable, test(testFunction), options);
            return false;
        }
        catch (error) {
            if (error instanceof EndError) {
                return true;
            }
            throw error;
        }
    });
}
exports.default = pOne;
;
