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
exports.sliceTask = exports.multiQuery = exports.retry = void 0;
const types_1 = require("./types");
const async_array_1 = require("../async-array");
const lodash_1 = require("lodash");
const delay_1 = __importDefault(require("delay"));
function _retry(el, request, onAttempt, times = 0, errors = []) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield request(el);
        }
        catch (e) {
            errors.push(e);
            times++;
            let continueAttempt = true;
            if (times > 5) {
                console.error(e);
            }
            if (onAttempt) {
                continueAttempt = yield onAttempt(e, times);
            }
            if (continueAttempt) {
                return yield _retry(el, request, onAttempt, times, errors);
            }
            throw errors;
        }
    });
}
function retry(el, request, onAttempt) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield _retry(el, request, onAttempt, 0, []);
    });
}
exports.retry = retry;
/**
 * Multiple query to boost the query rate.
 */
function multiQuery(args) {
    return __awaiter(this, void 0, void 0, function* () {
        let { elments, keys, query, breakpoint, uniqWith, request, prevData, cache } = args;
        const sort = query.sort ? query.sort : types_1.Sort.ASC;
        const { from, to } = keys;
        const lastLog = (0, lodash_1.last)(prevData);
        if (lastLog) {
            const rangeValue = breakpoint(lastLog);
            query = Object.assign(Object.assign({}, query), (sort === types_1.Sort.ASC ? { [from]: rangeValue } : { [to]: rangeValue }));
        }
        // multiple query
        const temp = yield async_array_1.AsyncArray.fromWithOptions(elments, { concurrency: elments.length }).mapAsync((el, i) => __awaiter(this, void 0, void 0, function* () {
            return yield retry({ el, query, i }, ({ el, query, i }) => __awaiter(this, void 0, void 0, function* () {
                return yield request(el, query, i);
            }));
        }));
        // debugger
        const logs = (0, lodash_1.flatten)(temp);
        // remove the duplicate elements
        if (prevData.length > 0) {
            let i = 0;
            while (i < logs.length) {
                const log = logs[i];
                const index = (0, lodash_1.findLastIndex)(prevData, el => uniqWith(el, log));
                if (index === -1) {
                    break;
                }
                logs.shift();
                i++;
            }
        }
        if (logs.length > 0) {
            // cache the elements 
            if (cache) {
                yield cache(logs);
            }
            if (logs.length > 0) {
                args.prevData = (0, lodash_1.concat)(prevData, logs).slice(-10000);
                return yield multiQuery(Object.assign({}, args));
            }
        }
    });
}
exports.multiQuery = multiQuery;
function poll(chunk, parentIndex, feedAmount, request, requestDelay = 0, _result, _retries) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = _result ? _result : new Array(chunk.length).fill(null);
        const retries = _retries ? _retries : new Array(chunk.length).fill(1);
        if (result.length !== chunk.length || retries.length !== chunk.length) {
            throw new Error('result.length should be equal to chunk.');
        }
        if (result.every(el => el !== null)) {
            return result.map(el => el.data);
        }
        yield async_array_1.AsyncArray.fromWithOptions(chunk, { concurrency: feedAmount }).forEachAsync((el, i) => __awaiter(this, void 0, void 0, function* () {
            if (!result[i]) {
                const data = yield retry({ el, index: parentIndex * chunk.length + i }, request, (e, times) => __awaiter(this, void 0, void 0, function* () {
                    retries[i] = times;
                    if (requestDelay) {
                        yield (0, delay_1.default)(requestDelay);
                    }
                    return true;
                }));
                result[i] = { data };
            }
        }));
        return yield poll(chunk, parentIndex, feedAmount, request, requestDelay, result, retries);
    });
}
function sliceTask(feedData, chunks, request, requestDelay, saveData) {
    return __awaiter(this, void 0, void 0, function* () {
        const dataChunks = (0, lodash_1.chunk)(feedData, chunks);
        const result = yield async_array_1.AsyncArray.fromWithOptions(dataChunks, { concurrency: 1 }).mapAsync((chunk, i) => __awaiter(this, void 0, void 0, function* () {
            const data = yield poll(chunk, i, chunks, request, requestDelay);
            if (saveData) {
                yield saveData(data, chunk);
            }
            return data;
        }));
        return (0, lodash_1.flatten)(result);
    });
}
exports.sliceTask = sliceTask;
