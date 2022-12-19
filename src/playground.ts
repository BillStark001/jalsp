import { lexBnf, parseEbnf, convertToBnf, PositionOptions } from ".";
import { getLinePositions } from "./jalsp/utils/str";
import * as J from './index';

const testGrammar = `
stmt = expr '=' expr [';'] | expr LPAREN expr_list RPAREN expr;

expr ::= (expr | HXD)  * 3 OPR2 expr | OPR1 expr | expr '?' expr ':' expr;
expr : IDENT | LITERAL;

Assignment = Identifier ':=' ( 'integer' | Identifier | 'string' );

`;

var rec = getLinePositions(testGrammar);
var tokens = lexBnf(testGrammar, true);
var res = parseEbnf(tokens);

// console.log(tokens);
// console.log(res);
// console.log(JSON.stringify(res));
var res2 = convertToBnf(res);
res2.forEach(x => console.log(x));

var weirdLex = J.newLexer()
  .t(() => undefined, / +/)
  .t((v, l) => l, /[\+\-\*\/]/)
  .build('EOF');

weirdLex.reset('              ').seek(1).seek(3, PositionOptions.Current);
console.log(weirdLex.currentPosition(), weirdLex.currentFilePosition());
console.log(weirdLex.reset('      ').nextToken());
