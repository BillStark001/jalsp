import { Token, TokenDefinition, TokenHandler, TokenStream } from "../models/token";
import { Position } from "../utils/str";
interface LexerRecord {
    pat: RegExp;
    f: TokenHandler;
}
export declare enum PositionOptions {
    Begin = 0,
    End = 1,
    Current = 2
}
export default class Lexer implements TokenStream {
    records: {
        [name: string]: LexerRecord;
    };
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
