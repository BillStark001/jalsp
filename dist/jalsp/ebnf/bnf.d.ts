import { Token } from '../models/token';
import 'ts-replace-all';
import { SimpleProductionCache } from '../models/grammar';
export declare function handleSingleQuoteString(strIn: string): string;
export declare function lexBnf(grammar: string, ebnf?: boolean): Token[];
export declare function parseBnf(tokens: Token[], commaSeparate?: boolean): SimpleProductionCache[];
