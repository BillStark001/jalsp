import { lexBnf, parseEbnf, convertToBnf } from ".";
import { getLinePositions } from "./jalsp/utils/str";

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
console.log(res);
console.log(JSON.stringify(res));
var res2 = convertToBnf(res);
res2.forEach(x => console.log(x));