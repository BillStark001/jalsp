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
A = B H { C | D | E } [ F ]
`;
var rec = (0, str_1.getLinePositions)(testGrammar);
var tokens = (0, _1.lexBnf)(testGrammar, true);
var res = (0, _1.parseEbnf)(tokens);
// console.log(tokens);
console.log(res);
var res2 = (0, _1.convertToBnf)(res, 1);
res2.forEach(x => console.log(x));
console.log(res2.length);
var singleCharLexer = J.newLexer()
    .t((v, l) => l, /./)
    .build('EOF');
var testParser = J.newParser()
    .ebnf('G = { A ";" }', (a) => a.map((x) => x[0]))
    .ebnf(testGrammar, (b, h, cde, f) => {
    console.log(b, h, cde, f);
    return b + h + (cde === null || cde === void 0 ? void 0 : cde.join('')) + (f !== null && f !== void 0 ? f : '');
})
    .build({ mode: 'SLR', eofToken: 'EOF', startSymbol: 'G' });
// console.log(JSON.stringify(res));
console.log(testParser.parse(singleCharLexer.reset('BHCCCCCCCCCCCF;BHDDDD;')));
var ebnf = (0, _1.parseEbnf)((0, _1.lexBnf)('E = A (B) * 2 [C] {D} * 3 | F', true));
var bnf = (0, _1.convertToBnf)(ebnf);
console.log(bnf);
