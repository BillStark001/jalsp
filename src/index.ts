import * as bnf from './jalsp/ebnf/bnf';
import * as ebnf from './jalsp/ebnf/ebnf';
import * as ebnfParser from './jalsp/ebnf/ebnf_parser';
import RegExpLexerBuilder from './jalsp/lexer/builder';
import LRGrammarBuilder from './jalsp/parser/builder';


import { GrammarDefinition } from './jalsp/models/grammar';
import { TokenDefinition } from './jalsp/models/token';

const lexBnf = bnf.lexBnf;
const parseBnf = bnf.parseBnf;
const parseEbnf = ebnfParser.default;
const convertToBnf = ebnf.convertToBnf;
const compileActionRecord = ebnf.compileActionRecord;

const newLexer = (lexicon?: TokenDefinition | RegExpLexerBuilder) => 
  new RegExpLexerBuilder(lexicon);
const newParser = (grammar?: GrammarDefinition | LRGrammarBuilder) => {
  var ret = new LRGrammarBuilder(grammar);
  ret.registerEbnfParser(parseEbnf);
  return ret;
};

export {
  lexBnf, 
  parseBnf, 
  parseEbnf, 
  convertToBnf, 
  compileActionRecord, 

  newLexer, 
  newParser,
};

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