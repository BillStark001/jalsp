import { lexBnf, parseBnf } from "../ebnf/bnf";
import { convertToBnf } from "../ebnf/ebnf";
import { ParserError } from "../models/error";
import { ComplexProduction, GrammarDefinition, OperatorDefinition, ProductionHandler, SimpleProduction } from "../models/grammar";
import { Token } from "../models/token";
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

  protected productions: SimpleProduction[];
  protected operators: OperatorDefinition[];

  protected prodCache: Map<string, number>;
  protected oprCache: Map<string, number>;
  protected lowestHierarchy: number;

  protected actions: (ProductionHandler | undefined)[];

  protected parseEbnf?: (prods: Token[]) => ComplexProduction[];

  constructor(grammar?: LRGrammarBuilder | GrammarDefinition) {
    var builder: LRGrammarBuilder | undefined = undefined;
    var def: GrammarDefinition | undefined = undefined;
    if (grammar !== undefined) {
      if (grammar instanceof LRGrammarBuilder) {
        builder = grammar;
      } else {
        def = grammar;
      }
    }

    this.productions = Array.from(builder?.productions ?? def?.productions ?? [])
      .map(x => ({ name: x.name, expr: x.expr, action: x.action }));
    this.operators = Array.from(builder?.operators ?? def?.operators ?? [])
      .map(x => Object.assign({}, x));
    this.prodCache = new Map();
    this.productions.forEach((x, i) => this.prodCache.set(JSON.stringify([x.name, x.expr]), i));
    this.oprCache = new Map();
    this.operators.forEach((x, i) => this.oprCache.set(x.name, i));
    this.lowestHierarchy = 65536;
    this.actions = [];

    this.parseEbnf = undefined;
  }

  act(handler?: ProductionHandler) {
    if (handler == undefined)
      return undefined;
    const index = this.actions.length;
    this.actions.push(handler);
    return index;
  }

  protected bnfInner(prods: SimpleProduction[], handlerIndex?: number) {
    for (var p of prods) {
      const sign = JSON.stringify([p.name, p.expr]);
      const handlerInUse = handlerIndex ?? p.action;
      if (this.prodCache.has(sign) && handlerInUse !== undefined) {
        this.productions[this.prodCache.get(sign)!].action = handlerInUse;
      } else {
        this.prodCache.set(sign, this.productions.length);
        p.action = handlerInUse;
        this.productions.push(p);
      }
    }
  }

  bnf(
    prods: string | SimpleProduction | SimpleProduction[],
    handler?: ProductionHandler
  ) {
    // normalize prod to array
    if (typeof (prods) == 'string' || prods instanceof String)
      prods = parseBnf(lexBnf(prods as string, false));
    // .map(x => [x.name, x.expr, undefined]);
    else if (!(prods instanceof Array))
      prods = [prods as SimpleProduction];

    const handlerIndex = this.act(handler);

    this.bnfInner(prods, handlerIndex);
    return this;
  }

  registerEbnfParser(parser: (prods: Token[]) => ComplexProduction[]) {
    this.parseEbnf = parser;
  }

  ebnf(
    prods: string | ComplexProduction | ComplexProduction[],
    handler?: ProductionHandler
  ) {

    // normalize prod to array
    if (typeof (prods) == 'string' || prods instanceof String) {
      if (this.parseEbnf == undefined)
        throw new ParserError('No EBNF parser is registered in this builder instance.');
      prods = this.parseEbnf(lexBnf(prods as string, true));
    }
    // .map(x => [x.name, x.expr, undefined]);
    else if (!(prods instanceof Array))
      prods = [prods as ComplexProduction];

    const handlerIndex = this.act(handler);
    var simpleProds = convertToBnf(prods, handlerIndex);
    this.bnfInner(simpleProds);

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
        prior: hier,
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
      var nts = new Set(this.productions.map(x => x.name));
      this.productions.forEach(x => x.expr.forEach(name => {
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
      actions: this.actions,
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
