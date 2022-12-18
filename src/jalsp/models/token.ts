import { Position } from "../utils/str";

export type TokenHandler = (arr: RegExpExecArray) => (any | undefined);



export interface Token {
  name: string,

  lexeme?: string,
  value?: any,

  position?: number,
  pos?: Position,
}

export interface TokenStream {
  nextToken(): Token,
  isEOF(t: Token): boolean,
  currentPosition(): number,
  currentFilePosition(): Position;
}

const EOF: (str: string) => Token = (str: string) => ({
  name: str,
  lexeme: str,
  value: str,
  position: -1,
  pos: { line: -1, col: -1 }
});

export function stringifyToken(t: Token) {
  var posStr = '';
  if (t.pos !== undefined)
    posStr = ` at (${t.pos.line}:${t.pos.col})`;
  else if (t.position !== undefined)
    posStr = ` at position ${t.position}`;
  return `${JSON.stringify(t.value)}(${t.name}/${JSON.stringify(t.lexeme)})` + posStr;
}

export class WrappedTokenArray implements TokenStream {

  private tokens: Token[];
  private pos: number;
  private eof: Token;

  constructor(tokens: Token[], eof?: string) {
    this.tokens = tokens;
    this.pos = 0;
    this.eof = EOF(eof || '<<EOF>>');
  }
  nextToken(): Token {
    if (this.pos >= this.tokens.length)
      return this.eof;
    return this.tokens[this.pos++];
  }
  isEOF(t: Token): boolean {
    return t.name == this.eof.name;
  }
  currentPosition(): number {
    return this.tokens[this.pos].position || -1;
  }
  currentFilePosition(): Position {
    return this.tokens[this.pos].pos || this.eof.pos!;
  }

  reset() {
    this.pos = 0;
  }

}

export interface TokenRecord {
  [0]: string; // name
  [1]: string; // pattern
  [2]: string; // flags
  [3]: number; // handler
}

export interface TokenDefinition {
  actions: (TokenHandler | undefined)[];
  records: TokenRecord[];
  eofToken?: string
}