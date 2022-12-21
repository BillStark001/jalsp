import { lexBnf, parseEbnf, convertToBnf, PositionOptions } from ".";
import { getLinePositions } from "./jalsp/utils/str";
import * as J from './index';

const testGrammar = `
A = B H { C | D | E } [ F ]
`;

var rec = getLinePositions(testGrammar);
var tokens = lexBnf(testGrammar, true);
var res = parseEbnf(tokens);

// console.log(tokens);
console.log(res);

var res2 = convertToBnf(res, 1);
res2.forEach(x => console.log(x));
console.log(res2.length);

var singleCharLexer = J.newLexer()
  .t((v, l) => l, /./)
  .build('EOF');

var testParser = J.newParser()
  .ebnf('G = { A ";" }', (a) => a.map((x: string[]) => x[0]))
  .ebnf(testGrammar, (b, h, cde, f) => {
    console.log(b, h, cde, f);
    return b + h + cde?.join('') + (f ?? '');
  })
  .build({ mode: 'SLR', eofToken: 'EOF', startSymbol: 'G' })


// console.log(JSON.stringify(res));


console.log(testParser.parse(singleCharLexer.reset('BHCCCCCCCCCCCF;BHDDDD;')));

var ebnf = parseEbnf(lexBnf('E = A (B) * 2 [C] {D} * 3 | F', true));
var bnf = convertToBnf(ebnf);
console.log(bnf);