import { lexBnf, parseBnf } from "../ebnf/bnf";
import { ParserError } from "../models/error";
import { GrammarDefinition, SimpleProduction, OperatorDefinition, ProductionHandler } from "../models/grammar";
import LRGenerator, { ParsedGrammar } from "./generator";
import Parser from "./parser";

export interface GrammarBuildingOptions {
  moduleName?: string,
  actionMode?: 'function' | 'constructor',
  mode?: 'LALR1' | 'SLR' | 'LR1' | 'lalr1' | 'slr' | 'lr1',
  tokens?: string[],

  startSymbol?: string, 
  eofToken?: string, 
  
}

export default class LRGrammarBuilder {

  private productions: SimpleProduction[];
  private operators: OperatorDefinition[];

  private prodCache: Map<string, number>;
  private oprCache: Map<string, number>;
  private lowestHierarchy: number;

  private actions: (ProductionHandler | undefined)[];

  constructor() {
    this.productions = [];
    this.operators = [];
    this.prodCache = new Map();
    this.oprCache = new Map();
    this.lowestHierarchy = 65536;
    this.actions = [];
  }

  bnf(
    prods: string | SimpleProduction | SimpleProduction[],
    handler?: ProductionHandler
  ) {
    // normalize prod to array
    if (typeof (prods) == 'string' || prods instanceof String)
      prods = parseBnf(lexBnf(prods as string, false))
        .map(x => [x.name, x.expr, undefined]);
    else if (typeof (prods[0]) == 'string' || prods[0] instanceof String)
      prods = [prods as SimpleProduction];


    for (var p of prods as SimpleProduction[]) {
      const sign = JSON.stringify([p[0], p[1]]);
      const handlerInUse = handler || p[2];
      if (this.prodCache.has(sign) && handlerInUse !== undefined) {
        this.productions[this.prodCache.get(sign)!][2] = handlerInUse;
      } else {
        this.prodCache.set(sign, this.productions.length);
        p[2] = handlerInUse;
        this.productions.push(p);
      }
    }
    return this;
  }

  opr(association: 'nonassoc' | 'left' | 'right', ...oprs: string[]): LRGrammarBuilder;
  opr(hierarchy: number, association: 'nonassoc' | 'left' | 'right', ...oprs: string[]): LRGrammarBuilder;
  opr(param0: number | string, ...params: string[]): LRGrammarBuilder {
    var hier = this.lowestHierarchy - 1;
    var assoc: string;
    var oprs: string[];
    if (typeof (param0) == 'number' || param0 as any instanceof Number) {
      hier = Number(param0);
      assoc = params[0];
      oprs = params.slice(1);
    } else {
      assoc = String(param0);
      oprs = params;
    }
    assoc = String(assoc || "nonassoc").toLowerCase().trim();
    if (assoc != 'nonassoc' && assoc != 'left' && assoc != 'right')
      throw new ParserError(`Invalid operator associativity: ${JSON.stringify(assoc)}.`, [hier, assoc, oprs]);
    oprs.forEach((name) => {
      const elem = {
        name: name,
        prio: hier,
        assoc: assoc as any
      };
      if (hier < this.lowestHierarchy)
        this.lowestHierarchy = hier;
      if (this.oprCache.has(name))
        this.operators[this.oprCache.get(name) as number] = elem;
      else {
        this.oprCache.set(name, this.operators.length);
        this.operators.push(elem);
      }
    });
    return this;
  }

  define(options?: GrammarBuildingOptions): GrammarDefinition {
    var tokens = options?.tokens;
    if (tokens === undefined) { // calculate all terminals
      tokens = [];
      var nts = new Set(this.productions.map(x => x[0]));
      this.productions.forEach(x => x[1].forEach(name => {
        if (!nts.has(name))
          tokens!.push(name);
      }));
    }
    var mode = options?.mode?.toUpperCase();

    return {
      moduleName: options?.moduleName || 'Parser',
      actionMode: options?.actionMode,
      mode: mode as any,
      tokens: tokens,
      productions: this.productions,
      operators: this.operators, 
      startSymbol: options?.startSymbol, 
      eofToken: options?.eofToken, 
    }
  }

  generate(options?: GrammarBuildingOptions): ParsedGrammar {
    var def = this.define(options);
    var gen = new LRGenerator(def);
    return gen.generateParsedGrammar();
  }

  build<T>(params?: GrammarBuildingOptions): Parser<T> {
    return new Parser(this.generate(params));
  }

}
