import { lexBnf, parseEbnf, convertToBnf, PositionOptions } from ".";
import { getLinePositions } from "./jalsp/utils/str";
import * as J from './index';

const testGrammar = `
expr = 
  expr (
      ADD | ADD_EQ | MINUS | MINUS_EQ | POW | POW_EQ
    | MULT | MULT_EQ | TDIV | TDIV_EQ | DIV | DIV_EQ | MOD | MOD_EQ
    | EQ | NEQ | LT | LT_EQ | GT | GT_EQ 
    | ANDL | ANDB | ORL | ORB | XORL | XORB
    | ASSGN | DEFAULT
    | FUNC_CALL | FUNC_CALL_REV | PROP_ACCESS
  ) expr
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
  .ebnf('A = B H { C | D | E } [ F ]', (b, h, cde, f) => {
    console.log(b, h, cde, f);
    return b + h + cde?.join('') + (f ?? '');
  })
  .build({ mode: 'SLR', eofToken: 'EOF', startSymbol: 'G' })


// console.log(JSON.stringify(res));


console.log(testParser.parse(singleCharLexer.reset('BHCCCCCCCCCCCF;BHDDDD;')));

var ebnf = parseEbnf(lexBnf('E = A (B) * 2 [C] {D} * 3 | F', true));
var bnf = convertToBnf(ebnf);
console.log(bnf);

var p = J.newParser()
.ebnf('conv = talker | conv texts'
)
.ebnf('texts = TEXT | texts TEXT', (t, ts) => ([t].concat(ts)).join(''))


p.define({ mode: 'SLR' }).productions.forEach(x => console.log(x));
p.build({ mode: 'SLR' });