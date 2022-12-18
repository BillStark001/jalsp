import { GrammarDefinition, SimpleProduction, ProductionHandler } from "../models/grammar";
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
    private productions;
    private operators;
    private prodCache;
    private oprCache;
    private lowestHierarchy;
    private actions;
    constructor();
    bnf(prods: string | SimpleProduction | SimpleProduction[], handler?: ProductionHandler): this;
    opr(association: 'nonassoc' | 'left' | 'right', ...oprs: string[]): LRGrammarBuilder;
    opr(hierarchy: number, association: 'nonassoc' | 'left' | 'right', ...oprs: string[]): LRGrammarBuilder;
    define(options?: GrammarBuildingOptions): GrammarDefinition;
    generate(options?: GrammarBuildingOptions): ParsedGrammar;
    build<T>(params?: GrammarBuildingOptions): Parser<T>;
}
