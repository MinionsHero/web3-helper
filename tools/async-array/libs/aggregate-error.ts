import indentString from './indent-string';
import cleanStack from './clean-stack';

const cleanInternalStack = stack => stack.replace(/\s+at .*aggregate-error\/index.js:\d+:\d+\)?/g, '');

/**
Create an error from multiple errors.
*/
export default class AggregateError<T extends Error = Error> extends Error {
	readonly name: 'AggregateError' = 'AggregateError';

	_errors: ReadonlyArray<T | Record<string, any> | string>;

	constructor(errors: ReadonlyArray<T | Record<string, any> | string>) {
		super()
		if (!Array.isArray(errors)) {
			throw new TypeError(`Expected input to be an Array, got ${typeof errors}`);
		}

		errors = errors.map(error => {
			if (error instanceof Error) {
				return error;
			}

			if (error !== null && typeof error === 'object') {
				// Handle plain error objects with message property and/or possibly other metadata
				return Object.assign(new Error(error.message), error);
			}

			return new Error(error);
		});

		let message = errors
			.map(error => {
				// The `stack` property is not standardized, so we can't assume it exists
				// @ts-ignore
				return typeof error.stack === 'string' ? cleanInternalStack(cleanStack(error.stack)) : String(error);
			})
			.join('\n');
		message = '\n' + indentString(message, 4);
		super(message);

		this._errors = errors;
	}

	get errors() {
		return this._errors.slice();
	}
}