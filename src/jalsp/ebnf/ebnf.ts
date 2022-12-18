
// EBNF elements

import { ComplexProduction, EbnfElement, ProductionHandlerModifier, SimpleProductionCache, ComplexProductionCache, ProductionHandler } from "../models/grammar";
import { getIncrementName } from "../utils/str";


export function isEbnf(elem: string | EbnfElement) {
  if (elem == undefined || elem instanceof String || typeof (elem) == 'string')
    return false;
  return elem.isEbnf == true;
}

export function isEbnfList2(elem: any) {
  return elem instanceof Array 
    && elem[0] instanceof Array 
    && (isEbnf(elem[0][0]) || typeof(elem[0][0]) == 'string' || elem[0][0] instanceof String);
}

// conversion

// special cases of types
function convertSingle(prod: ComplexProduction, getName: (init: string) => string, action: number) {

  const cache: ComplexProductionCache[] = [];
  prod.expr.forEach((expr, i) => {
    cache.push({ name: prod.name, expr: expr, action: action });
  });

  const ret: SimpleProductionCache[] = [];
  while (cache.length > 0) {
    const current = cache.pop()!;
    var handled = false;
    for (var i = 0; i < current.expr.length; ++i) {
      if (isEbnf(current.expr[i])) {
        handled = true;
        const curElem = current.expr[i] as EbnfElement;
        const preExpr = current.expr.slice(0, i);
        const postExpr = current.expr.slice(i + 1);

        const newExprs: ComplexProductionCache[] = cache;

        if (curElem.type === 'optional') {
          newExprs.push({
            name: current.name,
            expr: preExpr.concat(postExpr),
            action: 
              curElem.mult === undefined ? 
              ['epsilon', current.action, [i]] : 
              ['merge', current.action, [i, 0]]
          });

          const mult = curElem.mult || 1;
          if (mult < 1)
              continue;
          else
            for (var t = 1; t <= mult; ++t)
              curElem.productionList.forEach(
                pl => newExprs.push({
                  name: current.name,
                  expr: preExpr.concat(pl.repeat(t)).concat(postExpr), 
                  action: 
                    curElem.mult === undefined ? 
                    current.action : 
                    ['merge', current.action, [i, t]] // pos i, t times
                })
              );

        } else if (curElem.type === 'repeat') {
          // doesn't care mult
          const dashed = getName(current.name + '_EBNF_0');
          newExprs.push({
            name: dashed,
            expr: preExpr, 
            action: ['collect', undefined, [-1]], 
          });
          curElem.productionList.forEach(
            pl => newExprs.push({
              name: dashed,
              expr: [dashed as string | EbnfElement].concat(pl), 
              action: ['append', undefined, [1, 1]]
            })
          );
          newExprs.push({
            name: current.name,
            expr: [dashed as string | EbnfElement].concat(postExpr), 
            action: ['apply', current.action, [0]]
          });
        } else if (curElem.type === 'mult') {
          var mult = curElem.mult || 0;
          if (mult < 0)
            mult = 0;
          curElem.productionList.forEach(
            pl => newExprs.push({
              name: current.name,
              expr: preExpr.concat(Array(mult).fill(pl).flat()).concat(postExpr), 
              action: ['merge', current.action, [i, mult]]
            })
          );
        } else if (curElem.type === 'group') {
          var mult = curElem.mult || 1;
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
              var __arr: (string | EbnfElement)[][] = [];
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
        } else {
          throw Error(`Unhandled EBNF operation: ${JSON.stringify(curElem.type)}`);
        }
        break;
      }
    }

    if (handled) {
      // do nothing...
    } else {
      ret.push(current as SimpleProductionCache);
    }
  }
  return ret;
}

// general
export function convertToBnf(unparsed: ComplexProduction[]) {
  const nonTerminals: Set<string> = new Set();
  const terminals: Set<string> = new Set();

  // first add all names
  // in order to solve name conflict
  const nameStack: EbnfElement[] = [];
  for (const prod of unparsed) {
    nonTerminals.add(prod.name);
  }
  for (const prod of unparsed) {
    for (var expr of prod.expr) {
      for (var token of expr) {
        if (isEbnf(token))
          nameStack.push(token as EbnfElement);
        else if (!nonTerminals.has(String(token)))
          terminals.add(String(token));
      }
    }
  }
  while (nameStack.length > 0) {
    const curElem = nameStack.pop()!;
    for (var expr of curElem.productionList) {
      for (var token of expr) {
        if (isEbnf(token))
          nameStack.push(token as EbnfElement);
        else if (!nonTerminals.has(String(token)))
          terminals.add(String(token));
      }
    }
  }

  // convert in order
  const converted: SimpleProductionCache[] = [];
  const convertedCache: Set<string> = new Set();

  const getName = (name: string) => {
    while (nonTerminals.has(name) || terminals.has(name))
      name = getIncrementName(name);
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

// function compile

export const identityFunc: ProductionHandler = (...args) => args;

export function compileActionRecord(rec: ProductionHandlerModifier, f: (i: number) => ProductionHandler): ProductionHandler {
  
  var nextFunc: ProductionHandler | undefined;
  if (typeof(rec[1]) == 'number')
    nextFunc = f(rec[1]);
  else if (rec[1] instanceof Number)
    nextFunc = f(Number(rec[1]));
  else if (rec[1] === undefined)
    nextFunc = identityFunc;
  else
    nextFunc = compileActionRecord(rec[1], f);

  var nextFunc2 = nextFunc || identityFunc;
    
  if (rec[0] == 'epsilon') {
    var i = rec[2][0] || 0;
    return (...args) => nextFunc2(...(args.slice(0, i).concat([undefined]).concat(args.slice(i))));
  } else if (rec[0] == 'merge') {
    var i = rec[2][0] || 0;
    var t = rec[2][1] || 0;
    return (...args) => nextFunc2(...(args.slice(0, i).concat([args.slice(i, t)]).concat(args.slice(i+t))));
  } else if (rec[0] == 'collect') {
    var i = rec[2][0] || -1; // currently useless
    return nextFunc === undefined ? 
      (...args) => [args, []] : 
      (...args) => nextFunc!(args, []);
  } else if (rec[0] == 'append') {
    var i = rec[2][0] || 1; // currently useless
    var j = rec[2][1] || 1;
    return nextFunc === undefined ? 
      (...args) => [args[0][0], args[0][1].concat(args.slice(1))] : 
      (...args) => nextFunc!(args[0][0], args[0][1].concat(args.slice(1)));
  } else if (rec[0] == 'apply') {
    var i = rec[2][0] || 0; // currently useless
    return (pre: any[], post: any[]) => nextFunc2(...(pre.concat(post)));
  } else {
    return nextFunc;
  }
}

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
