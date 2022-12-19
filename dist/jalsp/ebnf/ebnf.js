"use strict";
// EBNF elements
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileActionRecord = exports.identityFunc = exports.convertToBnf = exports.isEbnfList2 = exports.isEbnf = void 0;
const str_1 = require("../utils/str");
function isEbnf(elem) {
    if (elem == undefined || elem instanceof String || typeof (elem) == 'string')
        return false;
    return elem.isEbnf == true;
}
exports.isEbnf = isEbnf;
function isEbnfList2(elem) {
    return elem instanceof Array
        && elem[0] instanceof Array
        && (isEbnf(elem[0][0]) || typeof (elem[0][0]) == 'string' || elem[0][0] instanceof String);
}
exports.isEbnfList2 = isEbnfList2;
// conversion
// special cases of types
function convertSingle(prod, getName, action) {
    var _a, _b, _c;
    const cache = [];
    prod.expr.forEach((expr, i) => {
        cache.push({ name: prod.name, expr: expr, action: action });
    });
    const ret = [];
    while (cache.length > 0) {
        const current = cache.pop();
        var handled = false;
        for (var i = 0; i < current.expr.length; ++i) {
            if (isEbnf(current.expr[i])) {
                handled = true;
                const curElem = current.expr[i];
                const preExpr = current.expr.slice(0, i);
                const postExpr = current.expr.slice(i + 1);
                const newExprs = cache;
                if (curElem.type === 'optional') {
                    newExprs.push({
                        name: current.name,
                        expr: preExpr.concat(postExpr),
                        action: curElem.mult === undefined ?
                            ['epsilon', current.action, [i]] :
                            ['merge', current.action, [i, 0]]
                    });
                    const mult = (_a = curElem.mult) !== null && _a !== void 0 ? _a : 1;
                    if (mult < 1)
                        continue;
                    else
                        for (var t = 1; t <= mult; ++t)
                            curElem.productionList.forEach(pl => newExprs.push({
                                name: current.name,
                                expr: preExpr.concat(pl.repeat(t)).concat(postExpr),
                                action: curElem.mult === undefined ?
                                    current.action :
                                    ['merge', current.action, [i, t]] // pos i, t times
                            }));
                }
                else if (curElem.type === 'repeat') {
                    // doesn't care mult
                    const dashed = getName(current.name + '_EBNF_0');
                    newExprs.push({
                        name: dashed,
                        expr: preExpr,
                        action: ['collect', undefined, [-1]],
                    });
                    curElem.productionList.forEach(pl => newExprs.push({
                        name: dashed,
                        expr: [dashed].concat(pl),
                        action: ['append', undefined, [1, 1]]
                    }));
                    newExprs.push({
                        name: current.name,
                        expr: [dashed].concat(postExpr),
                        action: ['apply', current.action, [0]]
                    });
                }
                else if (curElem.type === 'mult') {
                    var mult = (_b = curElem.mult) !== null && _b !== void 0 ? _b : 0;
                    if (mult < 0)
                        mult = 0;
                    curElem.productionList.forEach(pl => newExprs.push({
                        name: current.name,
                        expr: preExpr.concat(Array(mult).fill(pl).flat()).concat(postExpr),
                        action: ['merge', current.action, [i, mult]]
                    }));
                }
                else if (curElem.type === 'group') {
                    var mult = (_c = curElem.mult) !== null && _c !== void 0 ? _c : 1;
                    if (mult < 1)
                        newExprs.push({
                            name: current.name,
                            expr: preExpr.concat(postExpr),
                            action: ['epsilon', current.action, [i]]
                        });
                    else {
                        var arr = [preExpr];
                        for (var i = 0; i < mult; ++i) {
                            var _arr = arr
                                .map(x => curElem.productionList.map(y => x.concat(y)));
                            var __arr = [];
                            _arr.forEach(x => x.forEach(xx => __arr.push(xx)));
                            arr = __arr;
                        }
                        for (var prod2 of arr)
                            newExprs.push({
                                name: current.name,
                                expr: prod2.concat(postExpr),
                                action: ['merge', current.action, [i, mult]]
                            });
                    }
                }
                else {
                    throw Error(`Unhandled EBNF operation: ${JSON.stringify(curElem.type)}`);
                }
                break;
            }
        }
        if (handled) {
            // do nothing...
        }
        else {
            ret.push(current);
        }
    }
    return ret;
}
// general
function convertToBnf(unparsed) {
    const nonTerminals = new Set();
    const terminals = new Set();
    // first add all names
    // in order to solve name conflict
    const nameStack = [];
    for (const prod of unparsed) {
        nonTerminals.add(prod.name);
    }
    for (const prod of unparsed) {
        for (var expr of prod.expr) {
            for (var token of expr) {
                if (isEbnf(token))
                    nameStack.push(token);
                else if (!nonTerminals.has(String(token)))
                    terminals.add(String(token));
            }
        }
    }
    while (nameStack.length > 0) {
        const curElem = nameStack.pop();
        for (var expr of curElem.productionList) {
            for (var token of expr) {
                if (isEbnf(token))
                    nameStack.push(token);
                else if (!nonTerminals.has(String(token)))
                    terminals.add(String(token));
            }
        }
    }
    // convert in order
    const converted = [];
    const convertedCache = new Set();
    const getName = (name) => {
        while (nonTerminals.has(name) || terminals.has(name))
            name = (0, str_1.getIncrementName)(name);
        nonTerminals.add(name);
        return name;
    };
    for (var i = 0; i < unparsed.length; ++i) {
        const current = unparsed[i];
        const parsed = convertSingle(current, getName, i);
        for (var bnf of parsed) {
            var sign = JSON.stringify([bnf.name, bnf.expr]);
            if (!convertedCache.has(sign)) {
                convertedCache.add(sign);
                converted.push(bnf);
            }
        }
    }
    return converted;
}
exports.convertToBnf = convertToBnf;
// function compile
const identityFunc = (...args) => args;
exports.identityFunc = identityFunc;
function compileActionRecord(rec, f) {
    var _a, _b, _c, _d, _e, _f, _g;
    var nextFunc;
    if (typeof (rec[1]) == 'number')
        nextFunc = f(rec[1]);
    else if (rec[1] instanceof Number)
        nextFunc = f(Number(rec[1]));
    else if (rec[1] === undefined)
        nextFunc = exports.identityFunc;
    else
        nextFunc = compileActionRecord(rec[1], f);
    var nextFunc2 = nextFunc !== null && nextFunc !== void 0 ? nextFunc : exports.identityFunc;
    if (rec[0] == 'epsilon') {
        var i = (_a = rec[2][0]) !== null && _a !== void 0 ? _a : 0;
        return (...args) => nextFunc2(...(args.slice(0, i).concat([undefined]).concat(args.slice(i))));
    }
    else if (rec[0] == 'merge') {
        var i = (_b = rec[2][0]) !== null && _b !== void 0 ? _b : 0;
        var t = (_c = rec[2][1]) !== null && _c !== void 0 ? _c : 0;
        return (...args) => nextFunc2(...(args.slice(0, i).concat([args.slice(i, t)]).concat(args.slice(i + t))));
    }
    else if (rec[0] == 'collect') {
        var i = (_d = rec[2][0]) !== null && _d !== void 0 ? _d : -1; // currently useless
        return nextFunc === undefined ?
            (...args) => [args, []] :
            (...args) => nextFunc(args, []);
    }
    else if (rec[0] == 'append') {
        var i = (_e = rec[2][0]) !== null && _e !== void 0 ? _e : 1; // currently useless
        var j = (_f = rec[2][1]) !== null && _f !== void 0 ? _f : 1;
        return nextFunc === undefined ?
            (...args) => [args[0][0], args[0][1].concat(args.slice(1))] :
            (...args) => nextFunc(args[0][0], args[0][1].concat(args.slice(1)));
    }
    else if (rec[0] == 'apply') {
        var i = (_g = rec[2][0]) !== null && _g !== void 0 ? _g : 0; // currently useless
        return (pre, post) => nextFunc2(...(pre.concat(post)));
    }
    else {
        return nextFunc;
    }
}
exports.compileActionRecord = compileActionRecord;
/*
export function getBnfName(self: EbnfElement, head: string, id: number, additionalLength: number) {
  return `EBNF_${self.type}_${head}_${id}_L${additionalLength}`;
}

export function toBnf(self: EbnfElement, head: string, id: number, additional: NaiveProduction[]) {
  if (self.type === 'group')
    return toBnfGroup(self, head, id, additional);
  else if (self.type === 'optional')
    return toBnfOptional(self, head, id, additional);
  else if (self.type === 'repeat')
    return toBnfRepeat(self, head, id, additional);
  else
    return getBnfName(self, head, id, additional.length);
}

export function toBnfOptional(self: EbnfElement, head: string, id: number, additional: NaiveProduction[]) {
  //arrange an unique name
  var prod2: NaiveProduction;
  var prod1: NaiveProduction;
  var name = getBnfName(self, head, id, additional.length);

  if (self.productionList.length > 1) {
    prod1 = [name, [], (..._) => [] as any];
    prod2 = [name, self.productionList, () => [].slice.apply(arguments) as any];
  } else {
    prod1 = [name, [], (..._) => undefined];
    prod2 = [name, self.productionList, (...p) => p[0].v];
  }

  additional.push(prod1);
  additional.push(prod2);
  return name;
}

export function toBnfRepeat(self: EbnfElement, head: string, id: number, additional: NaiveProduction[]) {
  //arrange an unique name
  var prod2: NaiveProduction;
  var prod1: NaiveProduction;
  var name = getBnfName(self, head, id, additional.length);

  prod1 = [name, [], (..._) => [] as any];
  prod2 = [
    name,
    [name as string | EbnfElement].concat(self.productionList),
    (...args) => args[0].concat(args.slice(1))
  ];
  additional.push(prod1);
  additional.push(prod2);


  additional.push(prod1);
  additional.push(prod2);
  return name;
}

export function toBnfGroup(self: EbnfElement, head: string, id: number, additional: NaiveProduction[]) {
  //arrange an unique name
  var prod2: NaiveProduction;
  var prod1: NaiveProduction;
  var name = getBnfName(self, head, id, additional.length);

  var alternatives = [self.productionList];
  if (self.productionList.length > 1 && Array.isArray(self.productionList[0])) {
    alternatives = self.productionList;
  }
  alternatives.forEach(function (e) {
    var prod: NaiveProduction;
    if (!Array.isArray(e)) e = [e];
    if (e.length > 1) {
      prod = [name, e, function () {
        return Array.prototype.slice.call(arguments);
      }];
    } else {
      prod = [name, e, function () {
        return arguments[0];
      }];
    }

    additional.push(prod);
  });

  if (self.productionList.length > 1) {
    prod1 = [name, [], (..._) => [] as any];
    prod2 = [name, self.productionList, () => [].slice.apply(arguments) as any];
  } else {
    prod1 = [name, [], (..._) => undefined];
    prod2 = [name, self.productionList, (...p) => p[0].v];
  }

  additional.push(prod1);
  additional.push(prod2);
  return name;
}
*/
