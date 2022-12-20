import { Token, TokenDefinition, TokenHandler, TokenNameSelector, TokenStream } from "../models/token";
import { Position } from "../utils/str";
interface LexerRecord {
    name: string;
    pat: RegExp;
    f: TokenHandler;
    n?: TokenNameSelector;
}
export declare enum PositionOptions {
    Begin = 0,
    End = 1,
    Current = 2
}
export default class Lexer implements TokenStream {
    records: LexerRecord[];
    str?: string;
    rec?: number[];
    pos: number;
    eof: string;
    constructor({ actions, records, eofToken }: TokenDefinition);
    reset(str?: string): this;
    seek(pos: number, from?: PositionOptions): this;
    nextToken(): Token;
    isEOF(t: Token): boolean;
    currentPosition(): number;
    currentFilePosition(): Position;
}
export {};
