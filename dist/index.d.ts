import * as bnf from './jalsp/ebnf/bnf';
import * as ebnf from './jalsp/ebnf/ebnf';
import * as ebnfParser from './jalsp/ebnf/ebnf_parser';
import RegExpLexerBuilder from './jalsp/lexer/builder';
import LRGrammarBuilder from './jalsp/parser/builder';
import { GrammarDefinition } from './jalsp/models/grammar';
import { TokenDefinition } from './jalsp/models/token';
declare const lexBnf: typeof bnf.lexBnf;
declare const parseBnf: typeof bnf.parseBnf;
declare const parseEbnf: typeof ebnfParser.default;
declare const convertToBnf: typeof ebnf.convertToBnf;
declare const compileActionRecord: typeof ebnf.compileActionRecord;
declare const newLexer: (lexicon?: TokenDefinition | RegExpLexerBuilder) => RegExpLexerBuilder;
declare const newParser: (grammar?: GrammarDefinition | LRGrammarBuilder) => LRGrammarBuilder;
export { lexBnf, parseBnf, parseEbnf, convertToBnf, compileActionRecord, newLexer, newParser, };
export * from './jalsp/models/token';
export * from './jalsp/models/grammar';
export * from './jalsp/models/error';
export * from './jalsp/lexer/lexer';
export * from './jalsp/lexer/builder';
export * from './jalsp/parser/parser';
export * from './jalsp/parser/builder';
export * from './jalsp/parser/generator';
export { Position } from './jalsp/utils/str';
import Lexer from './jalsp/lexer/lexer';
import Parser from './jalsp/parser/parser';
export { Lexer, Parser };
