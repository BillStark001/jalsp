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
        this.records = [];
        this.str = undefined;
        this.pos = 0;
        this.eof = eofToken !== null && eofToken !== void 0 ? eofToken : '<<EOF>>';
        for (var rec of records) {
            let r2 = rec[2];
            if (r2.indexOf('y') < 0)
                r2 += 'y';
            const regex = new RegExp(rec[1], r2);
            this.records.push({
                name: rec[0],
                pat: regex,
                f: (_a = actions[rec[3]].h) !== null && _a !== void 0 ? _a : ID,
                n: actions[rec[3]].n
            });
        }
    }
    reset(str) {
        this.str = str !== null && str !== void 0 ? str : this.str;
        if (this.str != undefined)
            this.rec = (0, str_1.getLinePositions)(this.str);
        this.pos = 0;
        return this;
    }
    seek(pos, from) {
        var _a, _b;
        from = from !== null && from !== void 0 ? from : PositionOptions.Begin;
        if (from == PositionOptions.Current)
            pos += this.pos;
        else if (from == PositionOptions.End)
            pos += (_b = (_a = this.str) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
        this.pos = pos;
        return this;
    }
    nextToken() {
        var _a, _b;
        if (this.str == undefined)
            throw new error_1.LexerError("No input string assigned.");
        this.rec = (_a = this.rec) !== null && _a !== void 0 ? _a : (0, str_1.getLinePositions)(this.str);
        if (this.pos < 0 || this.pos > this.str.length)
            throw new error_1.LexerError(`Invalid pointer position: ${this.pos}.`);
        else if (this.pos >= this.str.length)
            return { name: this.eof, value: this.eof, lexeme: this.eof, position: this.pos, pos: this.currentFilePosition() };
        else {
            for (const { name, pat, f, n } of this.records) {
                pat.lastIndex = this.pos;
                var res;
                if ((res = pat.exec(this.str)) != null) {
                    this.pos = pat.lastIndex;
                    // determine value
                    const val = (_b = f(res)) !== null && _b !== void 0 ? _b : res[0];
                    // determine name
                    var realName = name;
                    if (n !== undefined) { // discard
                        var _realName = n(val, res[0]);
                        if (_realName === undefined)
                            return this.nextToken();
                        else
                            realName = _realName;
                    }
                    // form token
                    var ret = {
                        name: realName,
                        lexeme: res[0],
                        value: val,
                        position: res.index,
                        pos: (0, str_1.getLCIndex)(this.rec, res.index, true)
                    };
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
