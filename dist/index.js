"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newParser = exports.newLexer = exports.compileActionRecord = exports.convertToBnf = exports.parseEbnf = exports.parseBnf = exports.lexBnf = void 0;
const bnf = __importStar(require("./jalsp/ebnf/bnf"));
const ebnf = __importStar(require("./jalsp/ebnf/ebnf"));
const ebnfParser = __importStar(require("./jalsp/ebnf/ebnf_parser"));
const builder_1 = __importDefault(require("./jalsp/lexer/builder"));
const builder_2 = __importDefault(require("./jalsp/parser/builder"));
const lexBnf = bnf.lexBnf;
exports.lexBnf = lexBnf;
const parseBnf = bnf.parseBnf;
exports.parseBnf = parseBnf;
const parseEbnf = ebnfParser.default;
exports.parseEbnf = parseEbnf;
const convertToBnf = ebnf.convertToBnf;
exports.convertToBnf = convertToBnf;
const compileActionRecord = ebnf.compileActionRecord;
exports.compileActionRecord = compileActionRecord;
const newLexer = () => new builder_1.default();
exports.newLexer = newLexer;
const newParser = () => {
    var ret = new builder_2.default();
    // TODO add EBNF support
    return ret;
};
exports.newParser = newParser;
__exportStar(require("./jalsp/models/token"), exports);
__exportStar(require("./jalsp/models/grammar"), exports);
__exportStar(require("./jalsp/models/error"), exports);
__exportStar(require("./jalsp/lexer/lexer"), exports);
__exportStar(require("./jalsp/lexer/builder"), exports);
__exportStar(require("./jalsp/parser/parser"), exports);
__exportStar(require("./jalsp/parser/builder"), exports);
__exportStar(require("./jalsp/parser/generator"), exports);
