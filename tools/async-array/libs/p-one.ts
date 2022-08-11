import pMap, { Options } from './p-map';

class EndError extends Error { }

function test<ValueType>(testFunction: (element: ValueType, index: number) => boolean | PromiseLike<boolean>) {
  return async function (element: ValueType, index: number) {
    const value = await testFunction(element, index);
    if (value) {
      throw new EndError();
    }
    return value;
  }
}

/**
Test whether *some* promise passes a testing function. Fulfills when *any* promise in `input` and ones returned from `testFunction` are fulfilled, or rejects if any of the promises reject.

@param input - Iterated over concurrently in the `testFunction` function.
@param testFunction - Predicate function, expected to return a `Promise<boolean>` or `boolean`.
@returns `true` if any promise passed the test and `false` otherwise.
*/
export default async function pOne<ValueType>(
  iterable: Iterable<PromiseLike<ValueType> | ValueType>,
  testFunction: (element: ValueType, index: number) => boolean | Promise<boolean>,
  options?: Options
): Promise<boolean>{
  try {
    await pMap(iterable, test(testFunction), options);
    return false;
  } catch (error) {
    if (error instanceof EndError) {
      return true;
    }

    throw error;
  }
};


