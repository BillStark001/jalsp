export type ProductionHandler = (...args: any[]) => (any | undefined);
/**
 * modify the input data, and hand in to the next function or do nothing
 */
export interface ProductionHandlerModifier {
    [0]: 'id' | 'epsilon' | 'merge' | 'collect' | 'append' | 'apply';
    [1]: undefined | number | ProductionHandlerModifier;
    [2]: number[];
}
export interface EbnfElement {
    isEbnf: true;
    type: 'optional' | 'repeat' | 'group' | 'mult';
    productionList: (string | EbnfElement)[][];
    mult?: number;
}
export interface ComplexProduction {
    name: string;
    expr: (string | EbnfElement)[];
    action?: number | ProductionHandlerModifier;
}
export interface SimpleProduction {
    name: string;
    expr: string[];
    action?: number | ProductionHandlerModifier;
}
export interface OperatorDefinition {
    name: string;
    assoc: 'nonassoc' | 'left' | 'right';
    prio: number;
}
export interface GrammarDefinition {
    moduleName: string;
    actionMode?: 'function' | 'constructor';
    mode?: 'LALR1' | 'SLR' | 'LR1';
    tokens: string[];
    productions: SimpleProduction[];
    actions: (ProductionHandler | undefined)[];
    operators: OperatorDefinition[];
    startSymbol?: string;
    eofToken?: string;
}
export interface AutomatonActionRecord {
    [0]: 'reduce' | 'accept' | 'shift' | 'error';
    [1]: (number | string)[];
}
