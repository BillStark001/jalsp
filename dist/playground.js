"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const str_1 = require("./jalsp/utils/str");
const J = __importStar(require("./index"));
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
// console.log(res);
// console.log(JSON.stringify(res));
var res2 = (0, _1.convertToBnf)(res);
res2.forEach(x => console.log(x));
var weirdLex = J.newLexer()
    .t(() => undefined, / +/)
    .t((v, l) => l, /[\+\-\*\/]/)
    .build('EOF');
weirdLex.reset('              ').seek(1).seek(3, _1.PositionOptions.Current);
console.log(weirdLex.currentPosition(), weirdLex.currentFilePosition());
console.log(weirdLex.reset('      ').nextToken());
