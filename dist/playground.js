"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const str_1 = require("./jalsp/utils/str");
const testGrammar = `
stmt = expr '=' expr [';'] | expr LPAREN expr_list RPAREN expr;

expr ::= (expr | HXD)  * 3 OPR2 expr | OPR1 expr | expr '?' expr ':' expr;
expr : IDENT | LITERAL;

Assignment = Identifier ':=' ( 'integer' | Identifier | 'string' );

`;
var rec = (0, str_1.getLinePositions)(testGrammar);
var tokens = (0, _1.lexBnf)(testGrammar, true);
var res = (0, _1.parseEbnf)(tokens);
// console.log(tokens);
console.log(res);
console.log(JSON.stringify(res));
var res2 = (0, _1.convertToBnf)(res);
res2.forEach(x => console.log(x));
