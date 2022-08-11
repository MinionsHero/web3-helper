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
/**
Filter promises concurrently.

@param input - Iterated over concurrently in the `filterer` function.
@param filterer - The filterer function that decides whether an element should be included into result.

@example
```
import pFilter from 'p-filter';
import getWeather from 'get-weather'; // Not a real module

const places = [
  getCapital('Norway').then(info => info.name),
  'Bangkok, Thailand',
  'Berlin, Germany',
  'Tokyo, Japan',
];

const filterer = async place => {
  const weather = await getWeather(place);
  return weather.temperature > 30;
};

const result = await pFilter(places, filterer);

console.log(result);
//=> ['Bangkok, Thailand']
```
*/
function pFilter(iterable, filterer, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const values = yield (0, p_map_1.default)(iterable, (element, index) => Promise.all([filterer(element, index), element]), options);
        return values.filter(value => Boolean(value[0])).map(value => value[1]);
    });
}
exports.default = pFilter;
