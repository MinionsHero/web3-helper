import { Options } from './p-map';
import pMap from './p-map'

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
export default async function pFilter<ValueType>(iterable: Iterable<ValueType | PromiseLike<ValueType>>, filterer: (
  element: ValueType,
  index: number
) => boolean | PromiseLike<boolean>,
  options?: Options
): Promise<ValueType[]> {
  const values = await pMap(
    iterable,
    (element, index) => Promise.all([filterer(element, index), element]),
    options,
  );

  return values.filter(value => Boolean(value[0])).map(value => value[1]);
}

