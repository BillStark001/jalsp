import { ComplexProduction, EbnfElement, ProductionHandlerModifier, SimpleProductionCache, ProductionHandler } from "../models/grammar";
export declare function isEbnf(elem: string | EbnfElement): boolean;
export declare function isEbnfList2(elem: any): boolean;
export declare function convertToBnf(unparsed: ComplexProduction[]): SimpleProductionCache[];
export declare const identityFunc: ProductionHandler;
export declare function compileActionRecord(rec: ProductionHandlerModifier, f: (i: number) => ProductionHandler): ProductionHandler;
