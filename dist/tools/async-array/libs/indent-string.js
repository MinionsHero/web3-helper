"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function indentString(string, count = 1, options) {
    const { indent, includeEmptyLines } = Object.assign({}, {
        indent: ' ',
        includeEmptyLines: false
    }, options);
    if (typeof string !== 'string') {
        throw new TypeError(`Expected \`input\` to be a \`string\`, got \`${typeof string}\``);
    }
    if (typeof count !== 'number') {
        throw new TypeError(`Expected \`count\` to be a \`number\`, got \`${typeof count}\``);
    }
    if (count < 0) {
        throw new RangeError(`Expected \`count\` to be at least 0, got \`${count}\``);
    }
    if (typeof indent !== 'string') {
        throw new TypeError(`Expected \`options.indent\` to be a \`string\`, got \`${typeof indent}\``);
    }
    if (count === 0) {
        return string;
    }
    const regex = includeEmptyLines ? /^/gm : /^(?!\s*$)/gm;
    return string.replace(regex, indent.repeat(count));
}
exports.default = indentString;
