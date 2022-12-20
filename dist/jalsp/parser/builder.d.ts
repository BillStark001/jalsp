import { ComplexProduction, GrammarDefinition, OperatorDefinition, ProductionHandler, SimpleProduction } from "../models/grammar";
import { Token } from "../models/token";
import { ParsedGrammar } from "./generator";
import Parser from "./parser";
export interface GrammarBuildingOptions {
    moduleName?: string;
    actionMode?: 'function' | 'constructor';
    mode?: 'LALR1' | 'SLR' | 'LR1' | 'lalr1' | 'slr' | 'lr1';
    tokens?: string[];
    startSymbol?: string;
    eofToken?: string;
}
export default class LRGrammarBuilder {
    protected productions: SimpleProduction[];
    protected operators: OperatorDefinition[];
    protected prodCache: Map<string, number>;
    protected oprCache: Map<string, number>;
    protected lowestHierarchy: number;
    protected actions: (ProductionHandler | undefined)[];
    protected parseEbnf?: (prods: Token[]) => ComplexProduction[];
    constructor(grammar?: LRGrammarBuilder | GrammarDefinition);
    act(handler?: ProductionHandler): number | undefined;
    protected bnfInner(prods: SimpleProduction[], handlerIndex?: number): void;
    bnf(prods: string | SimpleProduction | SimpleProduction[], handler?: ProductionHandler): this;
    registerEbnfParser(parser: (prods: Token[]) => ComplexProduction[]): void;
    ebnf(prods: string | ComplexProduction | ComplexProduction[], handler?: ProductionHandler): this;
    opr(association: 'nonassoc' | 'left' | 'right', ...oprs: string[]): LRGrammarBuilder;
    opr(hierarchy: number, association: 'nonassoc' | 'left' | 'right', ...oprs: string[]): LRGrammarBuilder;
    define(options?: GrammarBuildingOptions): GrammarDefinition;
    generate(options?: GrammarBuildingOptions): ParsedGrammar;
    build<T>(params?: GrammarBuildingOptions): Parser<T>;
}
