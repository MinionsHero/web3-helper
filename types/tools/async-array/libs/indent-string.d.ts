export interface Options {
    /**
    The string to use for the indent.
  
    @default ' '
    */
    readonly indent?: string;
    /**
    Also indent empty lines.
  
    @default false
    */
    readonly includeEmptyLines?: boolean;
}
export default function indentString(string: string, count?: number, options?: Options): string;
