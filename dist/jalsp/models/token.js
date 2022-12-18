"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WrappedTokenArray = exports.stringifyToken = void 0;
const EOF = (str) => ({
    name: str,
    lexeme: str,
    value: str,
    position: -1,
    pos: { line: -1, col: -1 }
});
function stringifyToken(t) {
    var posStr = '';
    if (t.pos !== undefined)
        posStr = ` at (${t.pos.line}:${t.pos.col})`;
    else if (t.position !== undefined)
        posStr = ` at position ${t.position}`;
    return `${JSON.stringify(t.value)}(${t.name}/${JSON.stringify(t.lexeme)})` + posStr;
}
exports.stringifyToken = stringifyToken;
class WrappedTokenArray {
    constructor(tokens, eof) {
        this.tokens = tokens;
        this.pos = 0;
        this.eof = EOF(eof || '<<EOF>>');
    }
    nextToken() {
        if (this.pos >= this.tokens.length)
            return this.eof;
        return this.tokens[this.pos++];
    }
    isEOF(t) {
        return t.name == this.eof.name;
    }
    currentPosition() {
        return this.tokens[this.pos].position || -1;
    }
    currentFilePosition() {
        return this.tokens[this.pos].pos || this.eof.pos;
    }
    reset() {
        this.pos = 0;
    }
}
exports.WrappedTokenArray = WrappedTokenArray;
