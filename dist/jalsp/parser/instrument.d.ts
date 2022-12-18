import { IEquatable } from "../utils/equatable";
import { GSymbol } from "./symbol";
export declare class Production {
    head: GSymbol;
    body: GSymbol[];
    dot: number;
    items?: GItem[];
    constructor(head: GSymbol, body: GSymbol[]);
    toString(dot?: number): string;
    getItems(): GItem[];
}
export declare class GItem implements IEquatable {
    production: Production;
    dot: number;
    constructor(prod: Production, dot: number);
    toString(): string;
    isAtStart(): boolean;
    isAtEnd(): boolean;
    symbolAhead(): GSymbol;
    tail(): GSymbol[];
    nextItem(): GItem;
    equals(other: GItem): boolean;
}
export declare class LR1Item implements IEquatable {
    item: GItem;
    lookahead: GSymbol;
    constructor(item: GItem, lookahead: GSymbol);
    toString(): string;
    equals(other: any): boolean;
}
