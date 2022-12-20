"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const str_1 = require("../utils/str");
const lexer_1 = __importDefault(require("./lexer"));
class RegExpLexerBuilder {
    constructor(lexicon) {
        var _a, _b, _c, _d, _e;
        this.optionalToken = '';
        var builder = undefined;
        var def = undefined;
        if (lexicon !== undefined) {
            if (lexicon instanceof RegExpLexerBuilder) {
                builder = lexicon;
            }
            else {
                def = lexicon;
            }
        }
        this.actions = Array.from((_b = (_a = builder === null || builder === void 0 ? void 0 : builder.actions) !== null && _a !== void 0 ? _a : def === null || def === void 0 ? void 0 : def.actions) !== null && _b !== void 0 ? _b : [])
            .map(x => ({ h: x.h, n: x.n }));
        this.records = Array.from((_d = (_c = builder === null || builder === void 0 ? void 0 : builder.records) !== null && _c !== void 0 ? _c : def === null || def === void 0 ? void 0 : def.records) !== null && _d !== void 0 ? _d : [])
            .map(x => [x[0], x[1], x[2], x[3]]);
        this.usedTokens = new Set(this.records.map(x => x[0]));
        this.optionalToken = (_e = builder === null || builder === void 0 ? void 0 : builder.optionalToken) !== null && _e !== void 0 ? _e : 'OPTIONAL_TOKEN_0';
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
