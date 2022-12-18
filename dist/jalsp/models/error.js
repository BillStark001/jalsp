"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParserError = exports.LexerError = void 0;
class LexerError extends Error {
    constructor(msg, additional) {
        super(msg);
        this.additional = additional;
    }
}
exports.LexerError = LexerError;
class ParserError extends Error {
    constructor(msg, additional) {
        super(msg);
        this.additional = additional;
    }
}
exports.ParserError = ParserError;
