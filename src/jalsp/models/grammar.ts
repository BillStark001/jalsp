import { GSymbol } from "../parser/symbol";

export type ProductionHandler = (...args: any[]) => (any | undefined);


/**
 * modify the input data, and hand in to the next function or do nothing
 */
export interface ProductionHandlerModifier {
  [0]: 'id' | 'epsilon' | 'merge' | 'collect' | 'append' | 'apply',
  [1]: undefined | number | ProductionHandlerModifier, // the next move 
  [2]: number[] // opr params
}



export interface EbnfElement {
  isEbnf: true;
  type: 
  'optional' | 
  'repeat' | 
  'group' | 
  'mult'; // string literal with a mult sign
  productionList: (string | EbnfElement)[][];
  mult?: number; 
}

export interface ComplexProduction {
  name: string;
  expr: (string | EbnfElement)[][];
  action?: ProductionHandler;
}

export interface SimpleProduction {
  [0]: string;
  [1]: string[];
  [2]?: ProductionHandler;
}


export interface ComplexProductionCache {
  name: string;
  expr: (string | EbnfElement)[];
  action: number | ProductionHandlerModifier;
}

export interface SimpleProductionCache {
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
  operators: OperatorDefinition[];

  startSymbol?: string;
  eofToken?: string;

}

export interface AutomatonActionRecord {
  [0]: 'reduce' | 'accept' | 'shift' | 'error', 
  [1]: (number | string)[],
}


