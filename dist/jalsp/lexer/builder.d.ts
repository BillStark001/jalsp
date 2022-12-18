import { TokenDefinition, TokenHandler, TokenRecord } from "../models/token";
import Lexer from "./lexer";
export default class RegExpLexerBuilder {
    actions: (TokenHandler | undefined)[];
    records: TokenRecord[];
    constructor();
    private registerAction;
    /**
     *
     * @param name The token name.
     * @param pattern The matching pattern. global flag will be moved and sticky flag will be appended when it finally compiles to a RegExp object.
     * @param f The handler.
     */
    t(name: string, pattern: string | RegExp, f?: TokenHandler): this;
    define(eof?: string): TokenDefinition;
    build(eof?: string): Lexer;
}
