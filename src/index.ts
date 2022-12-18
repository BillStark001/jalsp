import * as bnf from './jalsp/ebnf/bnf';
import * as ebnf from './jalsp/ebnf/ebnf';
import * as ebnfParser from './jalsp/ebnf/ebnf_parser';
import RegExpLexerBuilder from './jalsp/lexer/builder';
import LRGrammarBuilder from './jalsp/parser/builder';

const lexBnf = bnf.lexBnf;
const parseBnf = bnf.parseBnf;
const parseEbnf = ebnfParser.default;
const convertToBnf = ebnf.convertToBnf;
const compileActionRecord = ebnf.compileActionRecord;

const newLexer = () => new RegExpLexerBuilder();
const newParser = () => {
  var ret = new LRGrammarBuilder();
  // TODO add EBNF support
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
}

export * from './jalsp/models/token';
export * from './jalsp/models/grammar';
export * from './jalsp/models/error';

export * from './jalsp/lexer/lexer';
export * from './jalsp/lexer/builder';

export * from './jalsp/parser/parser';
export * from './jalsp/parser/builder';
export * from './jalsp/parser/generator';