"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bnf_1 = require("../ebnf/bnf");
const error_1 = require("../models/error");
const generator_1 = __importDefault(require("./generator"));
const parser_1 = __importDefault(require("./parser"));
class LRGrammarBuilder {
    constructor() {
        this.productions = [];
        this.operators = [];
        this.prodCache = new Map();
        this.oprCache = new Map();
        this.lowestHierarchy = 65536;
        this.actions = [];
    }
    bnf(prods, handler) {
        // normalize prod to array
        if (typeof (prods) == 'string' || prods instanceof String)
            prods = (0, bnf_1.parseBnf)((0, bnf_1.lexBnf)(prods, false))
                .map(x => [x.name, x.expr, undefined]);
        else if (typeof (prods[0]) == 'string' || prods[0] instanceof String)
            prods = [prods];
        for (var p of prods) {
            const sign = JSON.stringify([p[0], p[1]]);
            const handlerInUse = handler || p[2];
            if (this.prodCache.has(sign) && handlerInUse !== undefined) {
                this.productions[this.prodCache.get(sign)][2] = handlerInUse;
            }
            else {
                this.prodCache.set(sign, this.productions.length);
                p[2] = handlerInUse;
                this.productions.push(p);
            }
        }
        return this;
    }
    opr(param0, ...params) {
        var hier = this.lowestHierarchy - 1;
        var assoc;
        var oprs;
        if (typeof (param0) == 'number' || param0 instanceof Number) {
            hier = Number(param0);
            assoc = params[0];
            oprs = params.slice(1);
        }
        else {
            assoc = String(param0);
            oprs = params;
        }
        assoc = String(assoc || "nonassoc").toLowerCase().trim();
        if (assoc != 'nonassoc' && assoc != 'left' && assoc != 'right')
            throw new error_1.ParserError(`Invalid operator associativity: ${JSON.stringify(assoc)}.`, [hier, assoc, oprs]);
        oprs.forEach((name) => {
            const elem = {
                name: name,
                prio: hier,
                assoc: assoc
            };
            if (hier < this.lowestHierarchy)
                this.lowestHierarchy = hier;
            if (this.oprCache.has(name))
                this.operators[this.oprCache.get(name)] = elem;
            else {
                this.oprCache.set(name, this.operators.length);
                this.operators.push(elem);
            }
        });
        return this;
    }
    define(options) {
        var _a;
        var tokens = options === null || options === void 0 ? void 0 : options.tokens;
        if (tokens === undefined) { // calculate all terminals
            tokens = [];
            var nts = new Set(this.productions.map(x => x[0]));
            this.productions.forEach(x => x[1].forEach(name => {
                if (!nts.has(name))
                    tokens.push(name);
            }));
        }
        var mode = (_a = options === null || options === void 0 ? void 0 : options.mode) === null || _a === void 0 ? void 0 : _a.toUpperCase();
        return {
            moduleName: (options === null || options === void 0 ? void 0 : options.moduleName) || 'Parser',
            actionMode: options === null || options === void 0 ? void 0 : options.actionMode,
            mode: mode,
            tokens: tokens,
            productions: this.productions,
            operators: this.operators,
            startSymbol: options === null || options === void 0 ? void 0 : options.startSymbol,
            eofToken: options === null || options === void 0 ? void 0 : options.eofToken,
        };
    }
    generate(options) {
        var def = this.define(options);
        var gen = new generator_1.default(def);
        return gen.generateParsedGrammar();
    }
    build(params) {
        return new parser_1.default(this.generate(params));
    }
}
exports.default = LRGrammarBuilder;
