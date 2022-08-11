"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
class FileTool {
    constructor(filename, options) {
        const o = Object.assign({}, {
            offset: 10000
        }, options);
        this.filename = filename;
        this.offset = o.offset;
    }
    get files() {
        if (fs_extra_1.default.existsSync(this.filename)) {
            const dirFs = fs_extra_1.default.readdirSync(this.filename);
            return dirFs;
        }
        return [];
    }
    get length() {
        let l = 0;
        const next = this.read();
        let data = [];
        while ((data = next())) {
            l += data.length;
        }
        return l;
    }
    get filenames() {
        const files = this.files;
        const filenames = files.map(el => el.replace('.json', '')).map(el => Number(el));
        if (!filenames.every(el => !Number.isNaN(el))) {
            throw new Error('parse error!');
        }
        return filenames;
    }
    get lastPageNumber() {
        const filenames = this.filenames;
        const lastPageNumber = filenames.length > 0 ? Math.max(...filenames) : 0;
        return lastPageNumber;
    }
    get firstPageNumber() {
        const filenames = this.filenames;
        const firstPageNumber = filenames.length > 0 ? Math.min(...filenames) : 0;
        return firstPageNumber;
    }
    readFile(index) {
        const lastPageNumber = this.lastPageNumber;
        if (index === 0 || index > lastPageNumber) {
            return null;
        }
        const filePath = path_1.default.resolve(this.filename, `${index}.json`);
        const data = fs_extra_1.default.readJsonSync(filePath);
        return Array.isArray(data) ? data : [];
    }
    writeFile(i, data) {
        fs_extra_1.default.ensureDirSync(this.filename);
        const filePath = path_1.default.resolve(this.filename, `${i}.json`);
        fs_extra_1.default.writeJsonSync(filePath, data);
    }
    fileExists(i) {
        const filePath = path_1.default.resolve(this.filename, `${i}.json`);
        return fs_extra_1.default.existsSync(filePath);
    }
    readLastPageData() {
        if (this.lastPageNumber) {
            return this.readFile(this.lastPageNumber);
        }
        return null;
    }
    readData() {
        const result = [];
        let data = [];
        const next = this.read();
        while ((data = next())) {
            result.push(...data);
        }
        return result;
    }
    tailData(length) {
        let result = [];
        for (let i = this.lastPageNumber; i > 0; i--) {
            let data = this.readFile(i);
            const restLength = length - result.length;
            if (data) {
                const r = restLength >= data.length ? data : data.slice(data.length - restLength);
                result = r.concat(result);
            }
            if (result.length === length) {
                break;
            }
        }
        return result;
    }
    /**
     * Read form the target position in the array.
     * @param cursor
     * @returns
     */
    read(cursor) {
        const lastPageNumber = this.lastPageNumber;
        const firstPageNumber = this.firstPageNumber;
        let index = firstPageNumber;
        return () => {
            if (index === 0 || index > this.lastPageNumber) {
                return null;
            }
            if (cursor && cursor > 0) {
                let sum = 0;
                let data;
                while ((data = this.readFile(index))) {
                    sum += data.length;
                    if (sum > cursor) {
                        break;
                    }
                    index++;
                }
                const file = this.readFile(index);
                cursor = 0;
                index++;
                return file ? file.slice(cursor - sum) : null;
            }
            const file = this.readFile(index);
            index++;
            return file;
        };
    }
    appendInternal(data) {
        if (data.length === 0) {
            return;
        }
        const lastPageNumber = this.lastPageNumber;
        if (this.fileExists(lastPageNumber)) {
            const originalData = this.readFile(lastPageNumber);
            if (originalData) {
                if (originalData.length < this.offset) {
                    const diff = this.offset - originalData.length;
                    const slice = Math.min(diff, data.length);
                    this.writeFile(lastPageNumber, originalData.concat(data.splice(0, slice)));
                }
                else {
                    this.writeFile(lastPageNumber + 1, data.splice(0, this.offset));
                }
            }
            else {
                this.writeFile(lastPageNumber, data.splice(0, this.offset));
            }
        }
        else {
            this.writeFile(1, data.splice(0, this.offset));
        }
        this.appendInternal(data);
    }
    append(data) {
        return this.appendInternal([...data]);
    }
}
exports.default = FileTool;
