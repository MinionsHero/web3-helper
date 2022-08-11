import pMap, { Options } from './p-map';

class EndError extends Error { }


function test<ValueType>(testFunction: (element: ValueType, index: number) => boolean | PromiseLike<boolean>) {
  return async function (element: ValueType, index: number) {
    const result = await testFunction(element, index);
    if (!result) {
      throw new EndError();
    }
    return result;
  }
}

/**
Test whether *all* promises pass a testing function. Fulfills when *all* promises in `input` and ones returned from `testFunction` are fulfilled, or rejects if any of the promises reject.

@param input - Iterated over concurrently in the `testFunction` function.
@param testFunction - Predicate function, expected to return a `Promise<boolean>` or `boolean`.
@returns `true` if all promises passed the test and `false` otherwise.
 */
export default async function pEvery<ValueType>(iterable: Iterable<PromiseLike<ValueType> | ValueType>, testFunction: (element: ValueType, index: number) => boolean | PromiseLike<boolean>, opts?: Options) {
  try {
    await pMap(iterable, test<ValueType>(testFunction), opts);
    return true;
  } catch (error) {
    if (error instanceof EndError) {
      return false;
    }
    throw error;
  }
};
