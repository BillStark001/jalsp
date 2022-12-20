import { IEquatable } from "../utils/equatable";
import { AutomatonActionRecord, GrammarDefinition, ProductionHandler, SimpleProduction } from "../models/grammar";
import { GItem, LR1Item, Production } from "./instrument";
import { eps, GSymbol, isNonTerminal, isTerminal, NT, T } from "./symbol";
import '../utils/enum_extensions';
import { getIncrementName } from "../utils/str";
import { ParserError } from "../models/error";
import { compileActionRecord } from "../ebnf/ebnf";

const EOF_INDEX = 0;

export interface ParsedGrammar {
  action: { [id: number]: AutomatonActionRecord[] };
  goto: { [id: number]: number[] };
  actionMode: string;
  actions: (ProductionHandler | undefined)[];
  startState: number;
  symbols: GSymbol[];
  symbolsTable: { [name: string]: number };
}

export function printActionTable(action: { [id: number]: AutomatonActionRecord[] }) {
  var str: string[];
  var i: number;
  for (var si in action) {
    i = Number(si);
    str = [];
    str.push(si);
    str.push(': ');
    for (var p in action[i]) {
      str.push(p);
      str.push('->');
      str.push(action[i][p][0]);
      str.push(action[i][p][1][0]?.toString());
      str.push('\t');
    }

    console.log(str.join(''));
  }
}

export default class LRGenerator {

  tokens: Set<string>;
  productions: Production[];
  actions: (ProductionHandler | undefined)[];
  operators: {
    [name: string]: {
      [0]: 'nonassoc' | 'left' | 'right',
      [1]: number
    }
  };

  start: GSymbol;

  moduleName: string;
  actionMode: 'function' | 'constructor';

  nonTerminals: NT[];
  terminals: T[];

  symbols: GSymbol[];
  symbolsTable: { [name: string]: number };

  first: { [name: string]: Set<GSymbol> } = {};
  follow: { [name: string]: Set<GSymbol> } = {};

  EOF: GSymbol;
  S1: GSymbol = eps;
  startItem: GItem[] | LR1Item[] = [];
  startProduction?: Production = undefined;
  action: { [id: number]: AutomatonActionRecord[] } = {};
  actionTrack: Map<AutomatonActionRecord, GItem> = new Map();
  goto: { [id: number]: number[] } = {};
  statesTable: GItem[][] | LR1Item[][] = [];
  startState: number = 0;



  constructor(grammar: GrammarDefinition) {
    var self = this;

    this.tokens = new Set(grammar.tokens);
    this.nonTerminals = [];
    this.terminals = [];
    this.moduleName = grammar.moduleName;
    this.actionMode = grammar.actionMode || 'function';
    this.symbols = [];
    this.symbolsTable = {};

    // determine eof
    this.EOF = new T(grammar.eofToken ?? '<<EOF>>');
    this.symbols.push(this.EOF);
    this.symbolsTable[this.EOF.toString()] = EOF_INDEX;
    this.terminals.push(this.EOF);
    this.tokens.add(this.EOF.name);

    this.operators = {};

    this.productions = [];
    this.actions = [];
    this.processProductions(grammar.productions, (i) => grammar.actions[i]);

    if (grammar.operators !== undefined) {
      grammar.operators.forEach(function (opList) {
        self.operators[opList.name] = [opList.assoc, opList.prio];
      });
    }

    // determine start symbol
    this.start = grammar.startSymbol ?
      this.symbols[this.symbolsTable[grammar.startSymbol]] :
      this.productions[0].head;

    this.computeFirstAndFollow();

    var mode = grammar.mode?.toUpperCase();
    if (mode === 'LALR1') {
      this.computeLR1(true);
    } else if (mode === 'SLR') {
      this.computeSLR();
    } else if (mode === 'LR1') {
      this.computeLR1(false);
    } else {
      this.computeAuto();
    }
  }


  computeAuto() {
    try {
      this.computeSLR();
    } catch (e) {
      try {
        this.computeLR1(true); // LALR1
      }
      catch (e) {
        this.computeLR1(false); // LR1
      }
    }
  }

  determineS1() {
    var s1Name = '__GLOBAL';
    while (this.nonTerminals.filter(x => x.name == s1Name).length > 0 || this.tokens.has(s1Name))
      s1Name = getIncrementName(s1Name);
    this.S1 = new NT(s1Name);
  }

  /**
   * here we split productions and actions, create internal productions and validate them
   * @param unparsed a list consists of simple BNF productions
   */
  processProductions(unparsed: SimpleProduction[], actionTable: (i: number) => ProductionHandler | undefined) {
    const self = this;
    const selfProductions = this.productions;
    const selfActions = this.actions;

    unparsed.forEach(function (production) {
      const head = production.name ?? '[E]';
      const body = production.expr ?? [];

      var action: ProductionHandler | undefined = undefined;
      if (typeof (production.action) == 'number' || production.action instanceof Number)
        action = actionTable(Number(production.action));
      else if (typeof (production.action) == 'undefined')
        action = undefined;
      else
        action = compileActionRecord(production.action, actionTable);

      var p = new Production(
        self.addGrammarElement(head),
        body.map((element) => self.addGrammarElement(element))
      );
      selfProductions.push(p);
      selfActions.push(action);

    });

  }

  addGrammarElement(element: string) {

    if (this.symbolsTable[element] == undefined) {
      var el = undefined;
      if (this.tokens.has(element)) {
        // it's a terminal
        el = new T(element);
        this.terminals.push(el);
      } else {
        el = new NT(element);
        this.nonTerminals.push(el);
      }
      var index = this.symbols.push(el) - 1;
      this.symbolsTable[element] = index;
    }
    return this.symbols[this.symbolsTable[element]];
  }

  // Computes FIRST and FOLLOW sets
  computeFirstAndFollow() {
    const self = this;

    var first: { [name: string]: Set<GSymbol> } = {};
    var nullable: { [name: string]: boolean } = {};
    var follow: { [name: string]: Set<GSymbol> } = {};
    self.terminals.forEach(function (t) {
      first[t.toString()] = new Set<GSymbol>([t]);
    });

    var done = false;

    // compute FIRST
    do {
      done = false;
      self.productions.forEach(function (p) {
        const lhs = p.head;
        const rhs = p.body;

        const lhss = lhs.toString();

        first[lhss] = first[lhss] ?? new Set();
        if (rhs.length == 0) {
          done = first[lhss].add2(eps) || done;
          nullable[lhss] = true;
        } else {
          var i;
          for (i = 0; i < rhs.length; i++) {
            var e = rhs[i];
            var es = e.toString();
            first[es] = first[es] ?? new Set();
            var fwe = new Set(first[es]);
            fwe.delete(eps);
            // add elements
            done = first[lhss].addSet2(fwe) || done;
            if (!first[es].has(eps)) break;
          }
          // let's check if all rhs elements were nullable
          if ((i === rhs.length) && (first[rhs[i - 1].toString()].has(eps))) {
            done = first[lhss].add2(eps) || done;
          }

        }
      });

    } while (done);

    // this is needed for computeFirst
    self.first = first;

    // compute FOLLOW
    const startStr = self.start.toString();
    follow[startStr] = follow[startStr] ?? new Set();
    follow[startStr].add(self.EOF);
    do {
      done = false;
      self.productions.forEach(function (p) {
        const rhs = p.body;
        const lhs = p.head;
        const lhss = lhs.toString();
        for (var i = 0; i < rhs.length; i++) {

          const rhsis = rhs[i].toString();
          if (isNonTerminal(rhs[i])) {
            follow[rhsis] = follow[rhsis] ?? new Set();
            if (i < rhs.length - 1) {
              // BUG: here we need to compute first(rhs[i+1]...rhs[n])
              var tail = rhs.slice(i + 1);
              // var f = first[rhs[i + 1]].clone();
              var f = self.computeFirst(tail);
              var epsfound = f.delete(eps);
              done = follow[rhsis].addSet2(f) || done;
              if (epsfound) {
                follow[lhss] = follow[lhss] ?? new Set();
                done = follow[rhsis].addSet2(follow[lhss]) || done;
              }
            } else {

              follow[lhss] = follow[lhss] ?? new Set();
              done = follow[rhsis].addSet2(follow[lhss]) || done;
            }


          }


        }
      });

    } while (done);

    self.follow = follow;
  }

  getProdutionsByHead(head: GSymbol) {
    return this.productions.filter(function (p) {
      return p.head.equals(head);
    });
  }

  computeFirst(list: GSymbol[]) {
    var ret: Set<GSymbol> = new Set();
    const self = this;

    for (var i = 0; i < list.length; i++) {
      var epsFound = false;
      var f = self.first[list[i].toString()];
      if (!f === undefined) {
        throw new ParserError(`Unexpected element: ${JSON.stringify(list[i].toString())} at position ${i}`, list[i]);
      }
      f.forEach(function (e) {
        if (e === eps) {
          epsFound = true;
        } else {
          ret.add(e);
        }
      });
      if (!epsFound) break;

    }
    if (i == list.length) {
      ret.add(eps);
    }
    return ret;
  }


  closure(items: GItem[]) {
    const self = this;
    var stack = Array.from(items);// .toArray();
    var p = 0;
    while (p < stack.length) {
      var item = stack[p];
      var B = item.symbolAhead();
      if (isNonTerminal(B)) {
        self.getProdutionsByHead(B).forEach(function (prod) {
          var ni = prod.getItems()[0];

          if (stack.filter((i) => ni.equals(i)).length == 0) {
            stack.push(ni);
          }

        });
      }
      p = p + 1;
    }
    return stack;
  }

  closureLR1(items: LR1Item[]) {
    const self = this;
    var stack = Array.from(items);// .toArray();
    var p = 0;
    while (p < stack.length) {
      var item = stack[p].item;
      var lookahead = stack[p].lookahead;
      var B = item.symbolAhead();
      if (isNonTerminal(B)) {
        self.getProdutionsByHead(B).forEach(function (prod) {
          var suffix = item.tail();
          suffix.push(lookahead);
          var first: Set<GSymbol> = self.computeFirst(suffix);
          Array.from(first).filter(function (symbol) {
            return isTerminal(symbol);
          })
            .forEach(function (b) {
              var ni = new LR1Item(prod.getItems()[0], b);
              if (stack.filter(function (item) {
                return ni.equals(item);
              }).length == 0) {
                stack.push(ni);
              }
            });
        });
      }
      p = p + 1;
    }
    return stack;
  }

  gotoLR0(i: GItem[], x: GSymbol) {
    var j: GItem[] = [];
    i.forEach(function (item) {
      if (!item.isAtEnd()) {
        if (item.symbolAhead().equals(x)) {
          j.push(item.nextItem());
        }
      }
    });
    // Nota: potrebbero esserci ripetizioni.
    return this.closure(j);
  }

  gotoLR1(i: LR1Item[], x: GSymbol) {
    var j: LR1Item[] = [];
    i.forEach(function (lr1Item) {
      var gItem = lr1Item.item;
      if (!gItem.isAtEnd()) {
        var a = lr1Item.lookahead;
        if (gItem.symbolAhead().equals(x)) {
          j.push(new LR1Item(gItem.nextItem(), a));
        }
      }
    });
    // Nota: potrebbero esserci ripetizioni.
    return this.closureLR1(j);
  }

  computeSLR() {
    const self = this;
    self.determineS1();
    const states: GItem[][] = [];

    var newAction: AutomatonActionRecord;
    self.action = {};
    self.goto = {};
    self.startProduction = new Production(self.S1, [self.start]);
    // start at I0 (state 0): closureLR1({[S'::=S,§]}) on stack to process
    self.startItem = self.closure([self.startProduction.getItems()[0]]);

    states.push(self.startItem);
    var i = 0;
    while (i < states.length) {
      // take the Ii state to process at the top of the stack
      var Ii = states[i];
      var act = (self.action[i] = self.action[i] ?? {});
      Ii.forEach(
        function (gItem) {
          // for each item
          if (gItem.isAtEnd()) {
            // if A is not S',  add ACTION(i, a) = reduce (A -> X)
            var p = gItem.production;
            var pIndex = self.productions.indexOf(p);
            if (!p.head.equals(self.S1)) {
              var follow = self.follow[p.head.toString()];
              follow.forEach(function (a) {
                newAction = ['reduce', [self.symbolsTable[gItem.production.head.name], gItem.production.body.length, pIndex]];
                self.tryAddAction(act, gItem, a, newAction);
              });
            }
            else { // A == S'
              act[EOF_INDEX] = ['accept', []];
              self.actionTrack.set(act[EOF_INDEX], gItem);
            }
          }
          else // not at end
          {
            var a = gItem.symbolAhead();
            // compute Ij = goto(Ii, X)
            var Ij = self.gotoLR0(Ii, a);
            // check if IJ is on the stack
            var j = self.findState(states, Ij);
            if (j < 0) {
              // push if Ij is not on the stack
              j = states.push(Ij) - 1;
            }
            else {
              // console.log("state already found");
            }
            // otherwise j = (position of Ij on the stack)
            var an = self.symbolsTable[a.name];
            if (isNonTerminal(a)) {
              // add to table GOTO(i, X) = j
              (self.goto[i] = self.goto[i] ?? {})[an] = j;
            } else {
              // add to ACTION(i, X) = shift j
              newAction = ['shift', [j]];
              self.tryAddAction(act, gItem, a, newAction);
            }
          }
        }
      );
      i = i + 1;
    }
    self.statesTable = states;
    self.startState = 0;
  }

  computeLR1(lalr1?: boolean) {
    const self = this;
    self.determineS1();
    const states: LR1Item[][] = [];

    var newAction: AutomatonActionRecord;
    self.action = {};
    self.goto = {};
    self.startProduction = new Production(self.S1, [self.start]);
    // start at I0 (state 0): closureLR1({[S'::=S,§]}) on stack to process
    self.startItem = self.closureLR1([new LR1Item(self.startProduction.getItems()[0], self.EOF)]);
    states.push(self.startItem);
    var i = 0;
    while (i < states.length) {
      // take the Ii state to process at the top of the stack
      var Ii = states[i];
      var act = (self.action[i] = self.action[i] ?? {});
      Ii.forEach(
        function (lr1Item) {
          // for each LR1item
          var gItem = lr1Item.item;

          var lookahead = lr1Item.lookahead;
          if (gItem.isAtEnd()) {
            // if A is not S',  add ACTION(i, a) = reduce (A -> X)
            var p = gItem.production;
            var pIndex = self.productions.indexOf(p);
            if (!p.head.equals(self.S1)) {
              newAction = ['reduce', [self.symbolsTable[gItem.production.head.name], gItem.production.body.length, pIndex]];
              self.tryAddAction(act, gItem, lookahead, newAction);
            }
            else { // A == S'
              act[EOF_INDEX] = ['accept', []];
              self.actionTrack.set(act[EOF_INDEX], gItem);
            }
          }
          else // not at end
          {
            var a = gItem.symbolAhead();
            // compute Ij = goto(Ii, X)
            var Ij = self.gotoLR1(Ii, a);
            // check if IJ is on the stack
            var j = self.findState(states, Ij, lalr1);
            if (j < 0) {
              // push if Ij is not on the stack
              j = states.push(Ij) - 1;
            }
            else {
              if (lalr1) // LR1: do nothing
                self.mergeStates(j, states[j], Ij);
            }
            // otherwise j = (position of Ij on the stack)
            var an = self.symbolsTable[a.name];
            if (isNonTerminal(a)) {
              // add to table GOTO(i, X) = j
              (self.goto[i] = self.goto[i] ?? {})[an] = j;
            } else {
              // add to ACTION(i, X) = shift j
              newAction = ['shift', [j]];
              self.tryAddAction(act, gItem, a, newAction);
            }
          }
        }
      );
      i = i + 1;
    }
    self.statesTable = states;
    self.startState = 0;
  }

  findState(list: IEquatable[][], state: IEquatable[], lr1ItemSimilar?: boolean) {
    for (var i = 0; i < list.length; i++) {
      var s = list[i];
      if (s.length != state.length) continue;
      // check if every item in s is also in state
      var equals = true;
      for (var i1 = 0; i1 < s.length; i1++) {
        var item1 = s[i1];

        var found = state.filter(
          lr1ItemSimilar ?
            (item2) => (item2 as LR1Item).item.equals((item1 as LR1Item).item) :
            (item2) => item2.equals(item1)
        ).length > 0;
        if (!found) {
          equals = false;
          break;
        }
      }
      if (equals) return i;
    }
    // we exited the loop, the state was not found
    return -1;
  }

  mergeStates(j: number, state: LR1Item[], other: LR1Item[]) {
    const self = this;
    state.forEach(function (lr1Item) {
      if (lr1Item.item.isAtEnd()) {
        const otherLR1item: LR1Item | undefined = other.filter((oLR1item) => {
          return oLR1item.item.equals(lr1Item.item);
        })[0];
        if (otherLR1item == undefined)
          return;

        // merge the lookahead of otherLR1item into the ones of lr1Item
        const gItem = otherLR1item.item;
        const p = gItem.production;
        const lookahead = otherLR1item.lookahead;
        const pIndex = self.productions.findIndex(x => x.equals(p));

        var act = (self.action[j] = self.action[j] ?? {});
        if (p.head.equals(self.S1)) { // A == S'
          act[EOF_INDEX] = ['accept', []];
          self.actionTrack.set(act[EOF_INDEX], gItem);
        } else {
          var newAction: AutomatonActionRecord = [
            'reduce', [
              self.symbolsTable[gItem.production.head.name],
              gItem.production.body.length,
              pIndex
            ]];
          self.tryAddAction(act, gItem, lookahead, newAction);
        }
      }

    });
  }

  tryAddAction(act: AutomatonActionRecord[], gItem: GItem, lookahead: GSymbol, newAction: AutomatonActionRecord) {
    const self = this;
    var an = self.symbolsTable[lookahead.toString()] ?? 0;
    // console.log(`tryAddAction ${lookahead} ${JSON.stringify(act)} ${an}`);

    if (act[an] === undefined) {
      act[an] = newAction;
    } else {
      // check if prod contains an operator and compare it to a
      act[an] = self.resolveConflict(act[an], newAction, lookahead, gItem, self.actionTrack.get(act[an]));
    }
    self.actionTrack.set(act[an], gItem);
  }


  getSymbols(): GSymbol[] {
    return this.nonTerminals.concat(this.terminals);
  }


  getConflictText(type: string, sym: GSymbol, gItem: GItem, conflict?: GItem) {
    var cflStr = '';
    if (conflict)
      cflStr = `between ${gItem} and ${conflict}`;
    else
      cflStr = `in ${gItem}`;
    return `${type} conflict ${cflStr} on ${sym}`;
  }

  resolveConflict(currentAction: AutomatonActionRecord, newAction: AutomatonActionRecord, a: GSymbol, gItem: GItem, conflict?: GItem): AutomatonActionRecord {
    // if current action is reduce we have a prod, otherwise?
    var shiftAction, reduceAction;
    var curtype = currentAction[0];
    var prod;
    if (curtype === 'reduce') {
      reduceAction = currentAction;

      if (newAction[0] == 'reduce') {
        if (newAction[1][0] != currentAction[1][0] || newAction[1][1] != currentAction[1][1]
          || newAction[1][2] != currentAction[1][2]) {
          throw new ParserError(this.getConflictText('Reduce/Reduce', a, gItem, conflict), [gItem, conflict]);
        }
        else {
          return currentAction;
        }
      } else {
        shiftAction = newAction;
      }
    } else { // current is shift
      shiftAction = currentAction;
      if (newAction[0] === 'shift') {
        if (newAction[1][0] != currentAction[1][0]) {
          throw new ParserError(this.getConflictText('Shift/Shift', a, gItem, conflict), [gItem, conflict]);
        } else {
          return currentAction;
        }
      } else {
        // new Action is Reduce
        reduceAction = newAction;
      }
    }

    prod = this.productions[reduceAction[1][2] as number];

    // check if a is an operator

    const operators = this.operators;
    if (operators && operators[a.name]) {
      var aassoc = operators[a.name][0];
      var aprio = operators[a.name][1];
      // check if prod contains an operator
      var op = prod.body.filter(function (t) {
        return operators[t.name]; // isTerminal(t) && 
      })[0];

      if (op) {
        var redassoc = operators[op.name][0];
        var redprio = operators[op.name][1];
        // first check if it is the same priority
        if (aprio === redprio) {
          // check associativity
          if (redassoc === 'nonassoc') {
            return ['error', [`Shift/Reduce conflict: Operator ${JSON.stringify(op)} is non-associative.`]]
          } else if (redassoc === 'left') {
            // prefer reduce
            return reduceAction;
          } else {
            // prefer shift
            return shiftAction;
          }
        } else if (aprio > redprio) {
          return shiftAction;
        } else { // aprio < redprio
          return reduceAction;
        }
      }
      else {

      }

    } else {
      // a is not an operator
    }
    throw new ParserError(this.getConflictText('Shift/Reduce', a, gItem, conflict), [gItem, conflict])
  }

  generateParsedGrammar(): ParsedGrammar {
    const specs = this;
    return {
      action: specs.action,
      goto: specs.goto,
      actions: specs.actions,
      startState: specs.startState,
      symbolsTable: specs.symbolsTable,
      actionMode: specs.actionMode,
      symbols: specs.symbols,
    }
  }

}