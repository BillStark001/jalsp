"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lexer_1 = __importDefault(require("./lexer"));
class RegExpLexerBuilder {
    constructor() {
        this.records = [];
        this.actions = [];
    }
    registerAction(f) {
        return this.actions.push(f) - 1;
    }
    /**
     *
     * @param name The token name.
     * @param pattern The matching pattern. global flag will be moved and sticky flag will be appended when it finally compiles to a RegExp object.
     * @param f The handler.
     */
    t(name, pattern, f) {
        var flags = 'y';
        var str = '';
        if (pattern instanceof RegExp) {
            flags = pattern.flags;
            flags = flags.replace('g', '');
            if (flags.indexOf('y') < 0)
                flags += 'y';
            str = pattern.source;
        }
        else {
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
    define(eof) {
        return {
            actions: this.actions,
            records: this.records,
            eofToken: eof
        };
    }
    build(eof) {
        return new lexer_1.default(this.define(eof));
    }
}
exports.default = RegExpLexerBuilder;
