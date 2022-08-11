"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const indent_string_1 = __importDefault(require("./indent-string"));
const clean_stack_1 = __importDefault(require("./clean-stack"));
const cleanInternalStack = stack => stack.replace(/\s+at .*aggregate-error\/index.js:\d+:\d+\)?/g, '');
/**
Create an error from multiple errors.
*/
class AggregateError extends Error {
    constructor(errors) {
        super();
        this.name = 'AggregateError';
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
            return typeof error.stack === 'string' ? cleanInternalStack((0, clean_stack_1.default)(error.stack)) : String(error);
        })
            .join('\n');
        message = '\n' + (0, indent_string_1.default)(message, 4);
        super(message);
        this._errors = errors;
    }
    get errors() {
        return this._errors.slice();
    }
}
exports.default = AggregateError;
