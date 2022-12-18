import { Token, TokenStream } from "../models/token";
import { AutomatonActionRecord, ProductionHandler } from "../models/grammar";
import { GSymbol } from "./symbol";
import { ParsedGrammar } from "./generator";
export interface ParserStackItem {
    s: number;
    i?: Token;
}
export default class Parser<T> {
    action: {
        [id: number]: AutomatonActionRecord[];
    };
    goto: {
        [id: number]: number[];
    };
    actionMode: string;
    actions: (ProductionHandler | undefined)[];
    startState: number;
    symbols: GSymbol[];
    symbolsTable: {
        [name: string]: number;
    };
    stream?: TokenStream;
    a?: Token;
    an?: number;
    accepted: boolean;
    inError: boolean;
    context?: T;
    stack?: ParserStackItem[];
    constructor(specs: ParsedGrammar);
    executeAction(rec?: AutomatonActionRecord): boolean;
    /**
     * Note: this only actually needs:
     * symbolsTable
     * action
     * actions
     * startState
     * @param stream
     * @param context
     * @returns
     */
    parse(stream: TokenStream, context?: T): any;
    shift(state: number): void;
    reduce(head: number, length: number, prodIndex: number): void;
    accept(): void;
    error(token: Token | string): void;
}
