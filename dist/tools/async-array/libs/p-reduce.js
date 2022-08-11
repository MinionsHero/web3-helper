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
Object.defineProperty(exports, "__esModule", { value: true });
/**
Reduce a list of values using promises into a promise for a value.

@param input - Iterated over serially in the `reducer` function.
@param reducer - Expected to return a value. If a `Promise` is returned, it's awaited before continuing with the next iteration.
@param initialValue - Value to use as `previousValue` in the first `reducer` invocation.
@returns A `Promise` that is fulfilled when all promises in `input` and ones returned from `reducer` are fulfilled, or rejects if any of the promises reject. The resolved value is the result of the reduction.

@example
```
import pReduce from 'p-reduce';
import humanInfo from 'human-info'; // Not a real module

const names = [
  getUser('sindresorhus').then(info => info.name),
  'Addy Osmani',
  'Pascal Hartig',
  'Stephen Sawchuk'
];

const totalAge = await pReduce(names, async (total, name) => {
  const info = await humanInfo(name);
  return total + info.age;
}, 0);

console.log(totalAge);
//=> 125
```
*/
function pReduce(iterable, reducer, initialValue) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const iterator = iterable[Symbol.iterator]();
            let index = 0;
            const next = (total) => __awaiter(this, void 0, void 0, function* () {
                const element = iterator.next();
                if (element.done) {
                    resolve(total);
                    return;
                }
                try {
                    const [resolvedTotal, resolvedValue] = yield Promise.all([total, element.value]);
                    next(reducer(resolvedTotal, resolvedValue, index++));
                }
                catch (error) {
                    reject(error);
                }
            });
            next(initialValue);
        });
    });
}
exports.default = pReduce;
