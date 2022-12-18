

import { lexBnf, parseBnf } from "../jalsp/ebnf/bnf";
import parseEbnf from '../jalsp/ebnf/ebnf_parser';

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
    expect(lexBnf(testBnf, true).length).toBeGreaterThan(0);
  });

  it('throws an error if an incorrect BNF grammar is fed', () => {
    expect(() => lexBnf(testGrammar, false)).toThrowError();
  });

  it('parses the given BNF grammar to 4 productions', () => {
    var res2 = lexBnf(testBnf, false);
    var res3 = parseBnf(res2, false);
    expect(res3.length).toBe(4);
    expect(res3[0].expr.length).toBe(3);
    expect(res3[1].expr.length).toBe(2);
    expect(res3[2].expr.length).toBe(5);
    expect(res3[3].expr.length).toBe(3);
  });

  it('parses EBNF grammar', () => {
    expect(lexBnf(testGrammar, true).length).toBeGreaterThan(0);
  });

  it('throws an error if an incorrect EBNF grammar is fed', () => {
    const lexRes = lexBnf(testGrammar + '= = = = = = = =', true);
    expect(() => parseEbnf(lexRes)).toThrowError();
  });

});


