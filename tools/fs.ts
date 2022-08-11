import fs from 'fs-extra'
import path from 'path'

export interface Options {
    offset?: number
}

export default class FileTool<T> {

    public offset: number
    public filename: string

    constructor(filename: string, options?: Options) {
        const o = Object.assign({}, {
            offset: 10000
        }, options)
        this.filename = filename
        this.offset = o.offset
    }

    private get files() {
        if (fs.existsSync(this.filename)) {
            const dirFs = fs.readdirSync(this.filename)
            return dirFs
        }
        return []
    }

    public get length() {
        let l = 0
        const next = this.read();
        let data: T[] | null = [];
        while ((data = next())) {
            l += data.length
        }
        return l
    }

    private get filenames() {
        const files = this.files
        const filenames = files.map(el => el.replace('.json', '')).map(el => Number(el))
        if (!filenames.every(el => !Number.isNaN(el))) {
            throw new Error('parse error!')
        }
        return filenames
    }

    private get lastPageNumber(): number {
        const filenames = this.filenames
        const lastPageNumber = filenames.length > 0 ? Math.max(...filenames) : 0
        return lastPageNumber
    }

    private get firstPageNumber(): number {
        const filenames = this.filenames
        const firstPageNumber = filenames.length > 0 ? Math.min(...filenames) : 0
        return firstPageNumber
    }

    private readFile(index: number) {
        const lastPageNumber = this.lastPageNumber
        if (index === 0 || index > lastPageNumber) {
            return null
        }
        const filePath = path.resolve(this.filename, `${index}.json`)
        const data: T[] = fs.readJsonSync(filePath)
        return Array.isArray(data) ? data : []
    }

    private writeFile(i: number, data: T[]) {
        fs.ensureDirSync(this.filename)
        const filePath = path.resolve(this.filename, `${i}.json`)
        fs.writeJsonSync(filePath, data)
    }

    private fileExists(i: number) {
        const filePath = path.resolve(this.filename, `${i}.json`)
        return fs.existsSync(filePath)
    }

    public readLastPageData() {
        if (this.lastPageNumber) {
            return this.readFile(this.lastPageNumber)
        }
        return null
    }

    public readData() {
        const result: T[] = [];
        let data: T[] | null = [];
        const next = this.read();
        while ((data = next())) {
            result.push(...data);
        }
        return result
    }

    public tailData(length: number) {
        let result: T[] = [];
        for (let i = this.lastPageNumber; i > 0; i--) {
            let data: T[] | null = this.readFile(i);
            const restLength = length - result.length
            if (data) {
                const r = restLength >= data.length ? data : data.slice(data.length - restLength)
                result = r.concat(result)
            }
            if (result.length === length) {
                break
            }
        }
        return result
    }

    /**
     * Read form the target position in the array.
     * @param cursor 
     * @returns 
     */
    public read(cursor?: number) {
        const lastPageNumber = this.lastPageNumber
        const firstPageNumber = this.firstPageNumber
        let index = firstPageNumber
        return () => {
            if (index === 0 || index > this.lastPageNumber) {
                return null
            }
            if (cursor && cursor > 0) {
                let sum = 0
                let data: T[] | null
                while ((data = this.readFile(index))) {
                    sum += data.length
                    if (sum > cursor) {
                        break
                    }
                    index++
                }
                const file = this.readFile(index)
                cursor = 0
                index++
                return file ? file.slice(cursor - sum) : null
            }
            const file = this.readFile(index)
            index++
            return file
        }
    }

    private appendInternal(data: T[]) {
        if (data.length === 0) {
            return
        }
        const lastPageNumber = this.lastPageNumber
        if (this.fileExists(lastPageNumber)) {
            const originalData: T[] | null = this.readFile(lastPageNumber)
            if (originalData) {
                if (originalData.length < this.offset) {
                    const diff = this.offset - originalData.length
                    const slice = Math.min(diff, data.length)
                    this.writeFile(lastPageNumber, originalData.concat(data.splice(0, slice)))
                } else {
                    this.writeFile(lastPageNumber + 1, data.splice(0, this.offset))
                }
            } else {
                this.writeFile(lastPageNumber, data.splice(0, this.offset))
            }
        } else {
            this.writeFile(1, data.splice(0, this.offset))
        }
        this.appendInternal(data)
    }

    public append(data: T[]) {
        return this.appendInternal([...data])
    }
}