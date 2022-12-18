import { Position } from "../utils/str";
export type TokenHandler = (arr: RegExpExecArray) => (any | undefined);
export interface Token {
    name: string;
    lexeme?: string;
    value?: any;
    position?: number;
    pos?: Position;
}
export interface TokenStream {
    nextToken(): Token;
    isEOF(t: Token): boolean;
    currentPosition(): number;
    currentFilePosition(): Position;
}
export declare function stringifyToken(t: Token): string;
export declare class WrappedTokenArray implements TokenStream {
    private tokens;
    private pos;
    private eof;
    constructor(tokens: Token[], eof?: string);
    nextToken(): Token;
    isEOF(t: Token): boolean;
    currentPosition(): number;
    currentFilePosition(): Position;
    reset(): void;
}
export interface TokenRecord {
    [0]: string;
    [1]: string;
    [2]: string;
    [3]: number;
}
export interface TokenDefinition {
    actions: (TokenHandler | undefined)[];
    records: TokenRecord[];
    eofToken?: string;
}
