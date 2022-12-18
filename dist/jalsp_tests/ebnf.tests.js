"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bnf_1 = require("../jalsp/ebnf/bnf");
const ebnf_parser_1 = __importDefault(require("../jalsp/ebnf/ebnf_parser"));
const testGrammar = `

stmt = expr '=' expr [';'] | expr LPAREN expr_list RPAREN expr;

expr ::= expr OPR2 expr | OPR1 expr | expr '?' expr ':' expr;
expr : IDENT | LITERAL;

`;
const testBnf = `
expr = expr OPR2 expr | OPR1 expr | expr '?' expr ':' expr | '(' expr ')'
`;
describe('Parsing BNF and EBNF syntax', () => {
    it('parses BNF grammar', () => {
        expect((0, bnf_1.lexBnf)(testBnf, true).length).toBeGreaterThan(0);
    });
    it('throws an error if an incorrect BNF grammar is fed', () => {
        expect(() => (0, bnf_1.lexBnf)(testGrammar, false)).toThrowError();
    });
    it('parses the given BNF grammar to 4 productions', () => {
        var res2 = (0, bnf_1.lexBnf)(testBnf, false);
        var res3 = (0, bnf_1.parseBnf)(res2, false);
        expect(res3.length).toBe(4);
        expect(res3[0].expr.length).toBe(3);
        expect(res3[1].expr.length).toBe(2);
        expect(res3[2].expr.length).toBe(5);
        expect(res3[3].expr.length).toBe(3);
    });
    it('parses EBNF grammar', () => {
        expect((0, bnf_1.lexBnf)(testGrammar, true).length).toBeGreaterThan(0);
    });
    it('throws an error if an incorrect EBNF grammar is fed', () => {
        const lexRes = (0, bnf_1.lexBnf)(testGrammar + '= = = = = = = =', true);
        expect(() => (0, ebnf_parser_1.default)(lexRes)).toThrowError();
    });
});
