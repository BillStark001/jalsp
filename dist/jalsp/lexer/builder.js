"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const str_1 = require("../utils/str");
const lexer_1 = __importDefault(require("./lexer"));
class RegExpLexerBuilder {
    constructor() {
        this.optionalToken = '';
        this.records = [];
        this.actions = [];
        this.optionalToken = 'OPTIONAL_TOKEN_0';
        this.usedTokens = new Set();
    }
    registerAction(h, n) {
        return this.actions.push({ h: h, n: n }) - 1;
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
        var realName;
        var sel = undefined;
        if (typeof (name) == 'string')
            realName = name;
        else {
            while (this.usedTokens.has(this.optionalToken))
                this.optionalToken = (0, str_1.getIncrementName)(this.optionalToken);
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
