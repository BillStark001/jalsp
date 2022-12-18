import { LexerError } from "../models/error";
import { Token, TokenDefinition, TokenHandler, TokenStream } from "../models/token";
import { getLCIndex, getLinePositions, Position } from "../utils/str";

const ID: TokenHandler = (arr) => {

}

interface LexerRecord {
  pat: RegExp;
  f: TokenHandler;
}

export enum PositionOptions {
  Begin, 
  End, 
  Current, 
}

export default class Lexer implements TokenStream {

  records: { [name: string]: LexerRecord }
  str?: string;
  rec?: number[];
  pos: number;
  eof: string;

  constructor({ actions, records, eofToken }: TokenDefinition) {
    this.records = {};
    this.str = undefined;
    this.pos = 0;
    this.eof = eofToken || '<<EOF>>';

    for (var rec of records) {
      let r2 = rec[2];
      if (r2.indexOf('y') < 0)
        r2 += 'y';
      const regex = new RegExp(rec[1], r2);

      this.records[rec[0]] = { pat: regex, f: actions[rec[3]] ?? ID };
    }
  }

  reset(str?: string) {
    this.str = str || this.str;
    if (this.str != undefined)
      this.rec = getLinePositions(this.str);
    this.pos = 0;
    return this;
  }

  seek(pos: number, from?: PositionOptions) {
    from = from || PositionOptions.Current;
    if (from == PositionOptions.Current)
      pos += this.pos;
    if (from == PositionOptions.End)
      pos += this.str?.length || 0;
    return this;
  }

  nextToken(): Token {
    if (this.str == undefined)
      throw new LexerError("No input string assigned.");
      
    this.rec = this.rec || getLinePositions(this.str);
    if (this.pos < 0 || this.pos > this.str.length)
      throw new LexerError(`Invalid pointer position: ${this.pos}.`);
    else if (this.pos >= this.str.length)
      return { name: this.eof, value: this.eof, lexeme: this.eof, position: this.pos, pos: this.currentFilePosition() }
    else {


      for (const name in this.records) {
        const { pat, f } = this.records[name];
        pat.lastIndex = this.pos;
        var res: RegExpExecArray | null;
        if ((res = pat.exec(this.str)) != null) {
          this.pos = pat.lastIndex;
          var ret: Token = {
            name: name, 
            lexeme: res[0], 
            position: res.index, 
            pos: getLCIndex(this.rec, res.index, true)
          }
          const val = f(res);
          ret.value = val || ret.lexeme;
          return ret;
        }
      }
      var p = this.currentFilePosition();
      throw new LexerError(`Unknown token ${JSON.stringify(
        this.pos + 10 < this.str.length ? 
        this.str.substring(this.pos, this.pos + 10) + '...' : 
        this.str.substring(this.pos)
        )} at position ${this.pos}/(${p.line}:${p.col})`);
    }
  }
  isEOF(t: Token): boolean {
    return t.name == this.eof;
  }
  currentPosition(): number {
    return this.pos;
  }
  currentFilePosition(): Position {
    if (this.str == undefined)
      return { line: 0, col: -1 };
    if (this.rec == undefined)
      this.rec = getLinePositions(this.str);
    return getLCIndex(this.rec, this.pos, true);
  }

}