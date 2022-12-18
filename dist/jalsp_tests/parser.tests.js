"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const builder_1 = __importDefault(require("../jalsp/parser/builder"));
const builder_2 = __importDefault(require("../jalsp/lexer/builder"));
var lexerAmb = new builder_2.default()
    .t('id', /[a-zA-Z_$][0-9a-zA-Z_$]*/)
    .t('int', /-?[0-9]+/, (res) => Number(res[0]))
    .t('+', /\+/)
    .t('*', /\*/)
    .t('(', /\(/)
    .t(')', /\)/)
    .build('eof');
var parserAmb = new builder_1.default()
    .bnf('E = E "+" E', (e, _, t) => '(' + e + '+' + t + ')')
    .bnf('E = E "*" E', (e, _, t) => '(' + e + '*' + t + ')')
    .bnf('E = int', i => String(i))
    .bnf('E = id', i => i)
    .bnf('E = "("E")"', (_, e, __) => '{' + e + '}')
    .opr(16, 'left', '*')
    .opr('left', '+')
    .build({ mode: 'SLR', eofToken: 'eof' });
describe('Parsing SLR, LALR(1) and LR(1) grammar', () => {
    it('parses Ambiguous grammar', function () {
        var ret = parserAmb.parse(lexerAmb.reset('2+3*4+5'));
        expect(ret).toBe('((2+(3*4))+5)');
    });
});
