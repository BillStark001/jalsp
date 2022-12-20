import { EbnfElement, ComplexProduction } from "../models/grammar";
import { Token, WrappedTokenArray } from "../models/token";
import LRGrammarBuilder from "../parser/builder";
import LRGenerator, { printActionTable } from "../parser/generator";
import Parser from "../parser/parser";

var ebnf = new LRGrammarBuilder()

  // .bnf('combine = ', (x) => x?.length)

  .bnf('ident = IDENTIFIER | STRING1 | STRING2', (x) => x ?? '[E]')
  .bnf('number = NON_NEG_INTEGER', (x) => x ?? 0)
  .bnf('elem = ident', (x) => x)
  .bnf('group = elem', (x) => [x])
  .bnf('group = elem group', (x, y) => [x].concat(y))
  .bnf('elem = RB_L groups RB_R | SB_L groups SB_R | CB_L groups CB_R', (l, m, r) => {
    var ret: EbnfElement = {
      isEbnf: true,
      type: l == '(' ? 'group' : (l == '[' ? 'optional' : 'repeat'),
      productionList: m
    };
    return ret;
  })
  .bnf('elem = group MULT number', (g: string | EbnfElement | (string | EbnfElement)[], s, n): EbnfElement => {
    if (typeof (g) == 'string')
      return {
        isEbnf: true,
        type: 'mult',
        productionList: [[g]],
        mult: n
      };
    else if (g instanceof Array)
      return {
        isEbnf: true,
        type: 'mult',
        productionList: [g],
        mult: n
      }
    else {
      g.mult = g.mult ?? 1;
      g.mult *= n;
      return g;
    }
  })
  .bnf('groups = group | groups OR group', (a, o, b): (string | EbnfElement)[][] => {
    if (o)
      return a.concat([b]);
    else
      return [a];
  })
  .bnf('prod = ident DEFINITION groups', (i, _, g: (string | EbnfElement)[][]): ComplexProduction[] => {
    return g.map<ComplexProduction>(h => ({
      name: i,
      expr: h,
    }));
  })
  .bnf('prod = ident DEFINITION', (i, _): Array<ComplexProduction> => [{name: i, expr: []}])

  .bnf('prods = ', () => [])
  .bnf('prods = prod', (p) => [p])
  .bnf('prods = prods SEP prod', (ps, _, p) => ps.concat([p]))
  .bnf('prods = prods SEP', (ps, _) => ps)



  .opr('left', 'elem')

  .opr('left', 'COMMA')
  .opr('left', 'MULT')
  .opr('left', 'OR')
  // .opr('left', 'DEFINITION')

  .define({
    mode: 'SLR',
    eofToken: 'EOF',
    startSymbol: 'prods'
  });

// console.log(ebnf);
// console.log(ebnf.productions);
// console.log(ebnf.operators);

var gen = new LRGenerator(ebnf);
var specs = gen.generateParsedGrammar();

// console.log(specs);
// printActionTable(specs.action);
// console.log(specs.goto);

var parser = new Parser(specs);

export default function parseEbnf(tokens: Token[]): ComplexProduction[] {
  var res = parser.parse(new WrappedTokenArray(
    tokens
      .filter(x => x.name != 'SPACE'), 'EOF'
  ), {}).flat();
  return res;
}