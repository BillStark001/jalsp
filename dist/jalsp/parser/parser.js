"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_1 = require("../models/token");
const error_1 = require("../models/error");
function identity(...x) {
    return x;
}
class Parser {
    constructor(specs) {
        // defs
        this.action = {};
        this.goto = {};
        this.startState = 0;
        this.accepted = false;
        this.inError = false;
        this.context = undefined;
        this.action = specs.action;
        this.goto = specs.goto;
        this.actions = specs.actions;
        this.startState = specs.startState;
        //This is needed to translate from lexer names to parser numbers
        this.symbolsTable = specs.symbolsTable;
        this.actionMode = specs.actionMode;
        this.symbols = specs.symbols;
    }
    executeAction(rec) {
        if (rec === undefined)
            return false;
        if (rec[0] == 'error')
            this.error(rec[1].join(', '));
        else if (rec[0] == 'shift')
            this.shift(rec[1][0]);
        else if (rec[0] == 'accept')
            this.accept();
        else if (rec[0] == 'reduce')
            this.reduce(rec[1][0], rec[1][1], rec[1][2]);
        else
            return false;
        return true;
    }
    /*
    create(ctor, args) {
      var args = [this.context].concat(args);
      var factory = ctor.bind.apply(ctor, args);
      return new factory();
    }
    */
    /**
     * Note: this only actually needs:
     * symbolsTable
     * action
     * actions
     * startState
     * @param stream
     * @param context
     * @returns
     */
    parse(stream, context) {
        var _a;
        this.stack = [];
        this.context = context;
        this.stream = stream;
        this.a = this.stream.nextToken();
        this.stack.push({ s: this.startState });
        this.accepted = false;
        this.inError = false;
        var top = undefined;
        while (!this.accepted && !this.inError) {
            top = this.stack[this.stack.length - 1];
            var s = top.s;
            //this.a = this.currentToken;
            if (stream.isEOF(this.a))
                this.an = 0;
            else
                this.an = this.symbolsTable[this.a.name];
            var action = this.action[s][this.an];
            if (this.executeAction(action)) {
                // do nothing
            }
            else {
                this.inError = true;
                if (action !== undefined)
                    this.error(`Unexpected action ${action[0]}(${action[1].map(x => JSON.stringify(x)).join(', ')}).`);
                else // `Undefined action found. (stack top: ${JSON.stringify(top)} a: ${JSON.stringify(this.a)} an: ${this.an})`
                    this.error(this.a);
            }
        }
        return (_a = top === null || top === void 0 ? void 0 : top.i) === null || _a === void 0 ? void 0 : _a.value;
    }
    shift(state) {
        this.stack.push({ s: state, i: this.a });
        this.a = this.stream.nextToken();
    }
    reduce(head, length, prodIndex) {
        if (this.stack === undefined) {
            this.error("Symbol stack is not yet initialized.");
            return;
        }
        var rhs = this.stack.splice(-length, length);
        var t = this.stack[this.stack.length - 1];
        var ns = this.goto[t.s][head];
        var value;
        if (this.actions) {
            var action = this.actions[prodIndex] || identity;
            var values = rhs.map(function (si) {
                var _a;
                return (_a = si.i) === null || _a === void 0 ? void 0 : _a.value;
            });
            value = action.apply(this.context, values);
        }
        //If we are debugging
        if (this.symbols) {
            var nt = { name: this.symbols[head].name, value: value };
            this.stack.push({ s: ns, i: nt });
        }
        else {
            this.stack.push({ s: ns, i: { name: '', value: value } });
        }
    }
    accept() {
        this.accepted = true;
    }
    error(token) {
        if (typeof token === 'string') {
            throw new error_1.ParserError(token);
        }
        else if (this.stream === undefined) {
            throw new error_1.ParserError("No token stream is assigned as the parser's input.");
        }
        else if (this.stream.isEOF(token)) {
            var { line, col } = this.stream.currentFilePosition();
            throw new error_1.ParserError(`Unexpected EOF at (${line}:${col})`);
        }
        else {
            throw new error_1.ParserError(`Unexpected token ${(0, token_1.stringifyToken)(token)})`);
        }
    }
}
exports.default = Parser;
