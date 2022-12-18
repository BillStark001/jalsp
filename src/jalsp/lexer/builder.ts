import { TokenDefinition, TokenHandler, TokenRecord } from "../models/token";
import Lexer from "./lexer";


export default class RegExpLexerBuilder {

  actions: (TokenHandler | undefined)[];
  records: TokenRecord[];

  constructor() {
    this.records = [];
    this.actions = [];
  }

  private registerAction(f?: TokenHandler) {
    return this.actions.push(f) - 1;
  }

  /**
   * 
   * @param name The token name. 
   * @param pattern The matching pattern. global flag will be moved and sticky flag will be appended when it finally compiles to a RegExp object.
   * @param f The handler.
   */
  t(name: string, pattern: string | RegExp, f?: TokenHandler) {
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

    this.records.push([
      name, 
      str, 
      flags, 
      this.registerAction(f)
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