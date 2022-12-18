"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionOptions = void 0;
const error_1 = require("../models/error");
const str_1 = require("../utils/str");
const ID = (arr) => {
};
var PositionOptions;
(function (PositionOptions) {
    PositionOptions[PositionOptions["Begin"] = 0] = "Begin";
    PositionOptions[PositionOptions["End"] = 1] = "End";
    PositionOptions[PositionOptions["Current"] = 2] = "Current";
})(PositionOptions = exports.PositionOptions || (exports.PositionOptions = {}));
class Lexer {
    constructor({ actions, records, eofToken }) {
        var _a;
        this.records = {};
        this.str = undefined;
        this.pos = 0;
        this.eof = eofToken || '<<EOF>>';
        for (var rec of records) {
            let r2 = rec[2];
            if (r2.indexOf('y') < 0)
                r2 += 'y';
            const regex = new RegExp(rec[1], r2);
            this.records[rec[0]] = { pat: regex, f: (_a = actions[rec[3]]) !== null && _a !== void 0 ? _a : ID };
        }
    }
    reset(str) {
        this.str = str || this.str;
        if (this.str != undefined)
            this.rec = (0, str_1.getLinePositions)(this.str);
        this.pos = 0;
        return this;
    }
    seek(pos, from) {
        var _a;
        from = from || PositionOptions.Current;
        if (from == PositionOptions.Current)
            pos += this.pos;
        if (from == PositionOptions.End)
            pos += ((_a = this.str) === null || _a === void 0 ? void 0 : _a.length) || 0;
        return this;
    }
    nextToken() {
        if (this.str == undefined)
            throw new error_1.LexerError("No input string assigned.");
        this.rec = this.rec || (0, str_1.getLinePositions)(this.str);
        if (this.pos < 0 || this.pos > this.str.length)
            throw new error_1.LexerError(`Invalid pointer position: ${this.pos}.`);
        else if (this.pos >= this.str.length)
            return { name: this.eof, value: this.eof, lexeme: this.eof, position: this.pos, pos: this.currentFilePosition() };
        else {
            for (const name in this.records) {
                const { pat, f } = this.records[name];
                pat.lastIndex = this.pos;
                var res;
                if ((res = pat.exec(this.str)) != null) {
                    this.pos = pat.lastIndex;
                    var ret = {
                        name: name,
                        lexeme: res[0],
                        position: res.index,
                        pos: (0, str_1.getLCIndex)(this.rec, res.index, true)
                    };
                    const val = f(res);
                    ret.value = val || ret.lexeme;
                    return ret;
                }
            }
            var p = this.currentFilePosition();
            throw new error_1.LexerError(`Unknown token ${JSON.stringify(this.pos + 10 < this.str.length ?
                this.str.substring(this.pos, this.pos + 10) + '...' :
                this.str.substring(this.pos))} at position ${this.pos}/(${p.line}:${p.col})`);
        }
    }
    isEOF(t) {
        return t.name == this.eof;
    }
    currentPosition() {
        return this.pos;
    }
    currentFilePosition() {
        if (this.str == undefined)
            return { line: 0, col: -1 };
        if (this.rec == undefined)
            this.rec = (0, str_1.getLinePositions)(this.str);
        return (0, str_1.getLCIndex)(this.rec, this.pos, true);
    }
}
exports.default = Lexer;
