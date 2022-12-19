import { TokenDefinition, TokenHandler, TokenNameSelector, TokenRecord } from "../models/token";
import { getIncrementName } from "../utils/str";
import Lexer from "./lexer";


export default class RegExpLexerBuilder {

  actions: { h?: TokenHandler, n?: TokenNameSelector }[];
  records: TokenRecord[];
  usedTokens: Set<string>;

  optionalToken = '';

  constructor() {
    this.records = [];
    this.actions = [];
    this.optionalToken = 'OPTIONAL_TOKEN_0';
    this.usedTokens = new Set();
  }

  private registerAction(h?: TokenHandler, n?: TokenNameSelector) {
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
    if (typeof(name) == 'string')
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