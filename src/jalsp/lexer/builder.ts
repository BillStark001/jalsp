import { TokenDefinition, TokenHandler, TokenNameSelector, TokenRecord } from "../models/token";
import { getIncrementName } from "../utils/str";
import Lexer from "./lexer";


export default class RegExpLexerBuilder {

  protected actions: { h?: TokenHandler, n?: TokenNameSelector }[];
  protected records: TokenRecord[];
  protected usedTokens: Set<string>;

  protected optionalToken = '';

  constructor(lexicon?: TokenDefinition | RegExpLexerBuilder) {

    var builder: RegExpLexerBuilder | undefined = undefined;
    var def: TokenDefinition | undefined = undefined;
    if (lexicon !== undefined) {
      if (lexicon instanceof RegExpLexerBuilder) {
        builder = lexicon;
      } else {
        def = lexicon;
      }
    }

    this.actions = Array.from(builder?.actions ?? def?.actions ?? [])
      .map(x => ({ h: x.h, n: x.n }));
    this.records = Array.from(builder?.records ?? def?.records ?? [])
      .map(x => [x[0], x[1], x[2], x[3]]);
    this.usedTokens = new Set(this.records.map(x => x[0]));
    this.optionalToken = builder?.optionalToken ?? 'OPTIONAL_TOKEN_0';
  }

  protected registerAction(h?: TokenHandler, n?: TokenNameSelector) {
    return this.actions.push({ h: h, n: n }) - 1;
  }

  /**
   * 
   * @param name The token name. 
   * @param pattern The matching pattern. global flag will be moved and sticky flag will be appended when it finally compiles to a RegExp object.
   * @param f The handler.
   */
  t(name: string | TokenNameSelector, pattern: string | RegExp, f?: TokenHandler) {
    var flags = 'y';
    var str = '';
    if (pattern instanceof RegExp) {
      flags = pattern.flags;
      flags = flags.replace('g', '');
      if (flags.indexOf('y') < 0)
        flags += 'y';
      str = pattern.source;
    } else {
      str = pattern;
    }
    // const regex = new RegExp(str, flags);
    var realName: string;
    var sel: TokenNameSelector | undefined = undefined;
    if (typeof (name) == 'string')
      realName = name;
    else {
      while (this.usedTokens.has(this.optionalToken))
        this.optionalToken = getIncrementName(this.optionalToken);
      realName = this.optionalToken;
      sel = name;
    }

    this.usedTokens.add(realName);
    this.records.push([
      realName,
      str,
      flags,
      this.registerAction(f, sel)
    ]);

    return this;
  }

  define(eof?: string): TokenDefinition {
    return {
      actions: this.actions,
      records: this.records,
      eofToken: eof
    }
  }

  build(eof?: string): Lexer {
    return new Lexer(this.define(eof));
  }

}