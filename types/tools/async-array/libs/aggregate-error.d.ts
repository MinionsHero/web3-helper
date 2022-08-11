/**
Create an error from multiple errors.
*/
export default class AggregateError<T extends Error = Error> extends Error {
    readonly name: 'AggregateError';
    _errors: ReadonlyArray<T | Record<string, any> | string>;
    constructor(errors: ReadonlyArray<T | Record<string, any> | string>);
    get errors(): (string | Record<string, any> | T)[];
}
