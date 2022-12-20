import { TokenDefinition, TokenHandler, TokenNameSelector, TokenRecord } from "../models/token";
import Lexer from "./lexer";
export default class RegExpLexerBuilder {
    protected actions: {
        h?: TokenHandler;
        n?: TokenNameSelector;
    }[];
    protected records: TokenRecord[];
    protected usedTokens: Set<string>;
    protected optionalToken: string;
    constructor(lexicon?: TokenDefinition | RegExpLexerBuilder);
    protected registerAction(h?: TokenHandler, n?: TokenNameSelector): number;
    /**
     *
     * @param name The token name.
     * @param pattern The matching pattern. global flag will be moved and sticky flag will be appended when it finally compiles to a RegExp object.
     * @param f The handler.
     */
    t(name: string | TokenNameSelector, pattern: string | RegExp, f?: TokenHandler): this;
    define(eof?: string): TokenDefinition;
    build(eof?: string): Lexer;
}
