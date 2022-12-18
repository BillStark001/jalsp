"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printActionTable = void 0;
const instrument_1 = require("./instrument");
const symbol_1 = require("./symbol");
require("../utils/enum_extensions");
const str_1 = require("../utils/str");
const error_1 = require("../models/error");
const EOF_INDEX = 0;
function printActionTable(action) {
    var _a;
    var str;
    var i;
    for (var si in action) {
        i = Number(si);
        str = [];
        str.push(si);
        str.push(': ');
        for (var p in action[i]) {
            str.push(p);
            str.push('->');
            str.push(action[i][p][0]);
            str.push((_a = action[i][p][1][0]) === null || _a === void 0 ? void 0 : _a.toString());
            str.push('\t');
        }
        console.log(str.join(''));
    }
}
exports.printActionTable = printActionTable;
class LRGenerator {
    constructor(grammar) {
        var _a;
        this.first = {};
        this.follow = {};
        this.S1 = symbol_1.eps;
        this.startItem = [];
        this.startProduction = undefined;
        this.action = {};
        this.actionTrack = new Map();
        this.goto = {};
        this.statesTable = [];
        this.startState = 0;
        var self = this;
        this.tokens = new Set(grammar.tokens);
        this.nonTerminals = [];
        this.terminals = [];
        this.moduleName = grammar.moduleName;
        this.actionMode = grammar.actionMode || 'function';
        this.symbols = [];
        this.symbolsTable = {};
        // determine eof
        this.EOF = new symbol_1.T(grammar.eofToken || '<<EOF>>');
        this.symbols.push(this.EOF);
        this.symbolsTable[this.EOF.toString()] = EOF_INDEX;
        this.terminals.push(this.EOF);
        this.tokens.add(this.EOF.name);
        this.operators = {};
        this.productions = [];
        this.actions = [];
        this.processProductions(grammar.productions);
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
        var mode = (_a = grammar.mode) === null || _a === void 0 ? void 0 : _a.toUpperCase();
        if (mode === 'LALR1') {
            this.computeLR1(true);
        }
        else if (mode === 'SLR') {
            this.computeSLR();
        }
        else if (mode === 'LR1') {
            this.computeLR1(false);
        }
        else {
            this.computeAuto();
        }
    }
    computeAuto() {
        try {
            this.computeSLR();
        }
        catch (e) {
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
            s1Name = (0, str_1.getIncrementName)(s1Name);
        this.S1 = new symbol_1.NT(s1Name);
    }
    /**
     * here we split productions and actions, create internal productions and validate them
     * @param unparsed a list consists of simple BNF productions
     */
    processProductions(unparsed) {
        const self = this;
        const selfProductions = this.productions;
        const selfActions = this.actions;
        unparsed.forEach(function (production) {
            const head = production[0] || '[E]';
            const body = production[1] || [];
            const action = production[2];
            var p = new instrument_1.Production(self.addGrammarElement(head), body.map(function (element) { return self.addGrammarElement(element); }));
            selfProductions.push(p);
            selfActions.push(action);
        });
    }
    addGrammarElement(element) {
        if (this.symbolsTable[element] == undefined) {
            var el = undefined;
            if (this.tokens.has(element)) {
                //it's a terminal
                el = new symbol_1.T(element);
                this.terminals.push(el);
            }
            else {
                el = new symbol_1.NT(element);
                this.nonTerminals.push(el);
            }
            var index = this.symbols.push(el) - 1;
            this.symbolsTable[element] = index;
        }
        return this.symbols[this.symbolsTable[element]];
    }
    //Computes FIRST and FOLLOW sets
    computeFirstAndFollow() {
        const self = this;
        var first = {};
        var nullable = {};
        var follow = {};
        self.terminals.forEach(function (t) {
            first[t.toString()] = new Set([t]);
        });
        var done = false;
        //compute FIRST
        do {
            done = false;
            self.productions.forEach(function (p) {
                const lhs = p.head;
                const rhs = p.body;
                const lhss = lhs.toString();
                first[lhss] = first[lhss] || new Set();
                if (rhs.length == 0) {
                    done = first[lhss].add2(symbol_1.eps) || done;
                    nullable[lhss] = true;
                }
                else {
                    var i;
                    for (i = 0; i < rhs.length; i++) {
                        var e = rhs[i];
                        var es = e.toString();
                        first[es] = first[es] || new Set();
                        var fwe = new Set(first[es]);
                        fwe.delete(symbol_1.eps);
                        // add elements
                        done = first[lhss].addSet2(fwe) || done;
                        if (!first[es].has(symbol_1.eps))
                            break;
                    }
                    //let's check if all rhs elements were nullable
                    if ((i === rhs.length) && (first[rhs[i - 1].toString()].has(symbol_1.eps))) {
                        done = first[lhss].add2(symbol_1.eps) || done;
                    }
                }
            });
        } while (done);
        //this is needed for computeFirst
        self.first = first;
        //compute FOLLOW
        const startStr = self.start.toString();
        follow[startStr] = follow[startStr] || new Set();
        follow[startStr].add(self.EOF);
        do {
            done = false;
            self.productions.forEach(function (p) {
                const rhs = p.body;
                const lhs = p.head;
                const lhss = lhs.toString();
                for (var i = 0; i < rhs.length; i++) {
                    const rhsis = rhs[i].toString();
                    if ((0, symbol_1.isNonTerminal)(rhs[i])) {
                        follow[rhsis] = follow[rhsis] || new Set();
                        if (i < rhs.length - 1) {
                            //BUG: here we need to compute first(rhs[i+1]...rhs[n])
                            var tail = rhs.slice(i + 1);
                            //var f = first[rhs[i + 1]].clone();
                            var f = self.computeFirst(tail);
                            var epsfound = f.delete(symbol_1.eps);
                            done = follow[rhsis].addSet2(f) || done;
                            if (epsfound) {
                                follow[lhss] = follow[lhss] || new Set();
                                done = follow[rhsis].addSet2(follow[lhss]) || done;
                            }
                        }
                        else {
                            follow[lhss] = follow[lhss] || new Set();
                            done = follow[rhsis].addSet2(follow[lhss]) || done;
                        }
                    }
                }
            });
        } while (done);
        self.follow = follow;
    }
    getProdutionsByHead(head) {
        return this.productions.filter(function (p) {
            return p.head.equals(head);
        });
    }
    computeFirst(list) {
        var ret = new Set();
        const self = this;
        for (var i = 0; i < list.length; i++) {
            var epsFound = false;
            var f = self.first[list[i].toString()];
            if (!f === undefined) {
                throw new error_1.ParserError(`Unexpected element: ${JSON.stringify(list[i].toString())} at position ${i}`, list[i]);
            }
            f.forEach(function (e) {
                if (e === symbol_1.eps) {
                    epsFound = true;
                }
                else {
                    ret.add(e);
                }
            });
            if (!epsFound)
                break;
        }
        if (i == list.length) {
            ret.add(symbol_1.eps);
        }
        return ret;
    }
    closure(items) {
        const self = this;
        var stack = Array.from(items); //.toArray();
        var p = 0;
        while (p < stack.length) {
            var item = stack[p];
            var B = item.symbolAhead();
            if ((0, symbol_1.isNonTerminal)(B)) {
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
    closureLR1(items) {
        const self = this;
        var stack = Array.from(items); //.toArray();
        var p = 0;
        while (p < stack.length) {
            var item = stack[p].item;
            var lookahead = stack[p].lookahead;
            var B = item.symbolAhead();
            if ((0, symbol_1.isNonTerminal)(B)) {
                self.getProdutionsByHead(B).forEach(function (prod) {
                    var suffix = item.tail();
                    suffix.push(lookahead);
                    var first = self.computeFirst(suffix);
                    Array.from(first).filter(function (symbol) {
                        return (0, symbol_1.isTerminal)(symbol);
                    })
                        .forEach(function (b) {
                        var ni = new instrument_1.LR1Item(prod.getItems()[0], b);
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
    gotoLR0(i, x) {
        var j = [];
        i.forEach(function (item) {
            if (!item.isAtEnd()) {
                if (item.symbolAhead().equals(x)) {
                    j.push(item.nextItem());
                }
            }
        });
        //Nota: potrebbero esserci ripetizioni.
        return this.closure(j);
    }
    gotoLR1(i, x) {
        var j = [];
        i.forEach(function (lr1item) {
            var gitem = lr1item.item;
            if (!gitem.isAtEnd()) {
                var a = lr1item.lookahead;
                if (gitem.symbolAhead() === x) {
                    j.push(new instrument_1.LR1Item(gitem.nextItem(), a));
                }
            }
        });
        //Nota: potrebbero esserci ripetizioni.
        return this.closureLR1(j);
    }
    computeSLR() {
        const self = this;
        self.determineS1();
        var states = [];
        var newAction;
        self.action = {};
        self.goto = {};
        self.startProduction = new instrument_1.Production(self.S1, [self.start]);
        //Inizia da I0 (stato 0): closure({[S'::=S,§]}) sullo stack da elaborare
        self.startItem = self.closure([self.startProduction.getItems()[0]]);
        states.push(self.startItem);
        var i = 0;
        while (i < states.length) {
            // take the Ii state to process at the top of the stack
            var Ii = states[i];
            var act = (self.action[i] = self.action[i] || {});
            Ii.forEach(function (gitem) {
                //per ogni item
                if (gitem.isAtEnd()) {
                    // if A is not S',  add ACTION(i, a) = reduce (A -> X)
                    var p = gitem.production;
                    var pindex = self.productions.indexOf(p);
                    if (p.head !== self.S1) {
                        var follow = self.follow[p.head.toString()];
                        follow.forEach(function (a) {
                            newAction = ['reduce', [self.symbolsTable[gitem.production.head.name], gitem.production.body.length, pindex]];
                            self.tryAddAction(act, gitem, a, newAction);
                        });
                    }
                    else { //A == S'
                        act[EOF_INDEX] = ['accept', []];
                        self.actionTrack.set(act[EOF_INDEX], gitem);
                    }
                }
                else //not at end
                 {
                    var a = gitem.symbolAhead();
                    //Calcola Ij=gotoLR1(Ii,X)
                    var Ij = self.gotoLR0(Ii, a);
                    //check if IJ is on the stack
                    var j = self.findState(states, Ij);
                    if (j < 0) {
                        // push if Ij is not on the stack
                        j = states.push(Ij) - 1;
                    }
                    else {
                        //console.log("state already found");
                    }
                    // otherwise j = (position of Ij on the stack)
                    var an = self.symbolsTable[a.name];
                    if ((0, symbol_1.isNonTerminal)(a)) {
                        // add to table GOTO(i, X) = j
                        (self.goto[i] = self.goto[i] || {})[an] = j;
                    }
                    else {
                        // add to ACTION(i, X) = shift j
                        newAction = ['shift', [j]];
                        self.tryAddAction(act, gitem, a, newAction);
                    }
                }
            });
            i = i + 1;
        }
        self.statesTable = states;
        self.startState = 0;
    }
    computeLR1(lalr1) {
        const self = this;
        self.determineS1();
        var states = [];
        var newAction;
        self.action = {};
        self.goto = {};
        self.startProduction = new instrument_1.Production(self.S1, [self.start]);
        // start at I0 (state 0): closureLR1({[S'::=S,§]}) on stack to process
        self.startItem = self.closureLR1([new instrument_1.LR1Item(self.startProduction.getItems()[0], self.EOF)]);
        states.push(self.startItem);
        var i = 0;
        while (i < states.length) {
            // take the Ii state to process at the top of the stack
            var Ii = states[i];
            var act = (self.action[i] = self.action[i] || {});
            Ii.forEach(function (lr1item) {
                // for each LR1item
                var gitem = lr1item.item;
                var lookahead = lr1item.lookahead;
                if (gitem.isAtEnd()) {
                    // if A is not S',  add ACTION(i, a) = reduce (A -> X)
                    var p = gitem.production;
                    var pindex = self.productions.indexOf(p);
                    if (!p.head.equals(self.S1)) {
                        newAction = ['reduce', [self.symbolsTable[gitem.production.head.name], gitem.production.body.length, pindex]];
                        self.tryAddAction(act, gitem, lookahead, newAction);
                    }
                    else { //A == S'
                        act[EOF_INDEX] = ['accept', []];
                        self.actionTrack.set(act[EOF_INDEX], gitem);
                    }
                }
                else //not at end
                 {
                    var a = gitem.symbolAhead();
                    // compute Ij = gotoLR1(Ii, X)
                    var Ij = self.gotoLR1(Ii, a);
                    // check if IJ is on the stack
                    var j = lalr1 ? self.findSimilarState(states, Ij) : self.findState(states, Ij);
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
                    if ((0, symbol_1.isNonTerminal)(a)) {
                        // add to table GOTO(i, X) = j
                        (self.goto[i] = self.goto[i] || {})[an] = j;
                    }
                    else {
                        // add to ACTION(i, X) = shift j
                        newAction = ['shift', [j]];
                        self.tryAddAction(act, gitem, a, newAction);
                    }
                }
            });
            i = i + 1;
        }
        self.statesTable = states;
        self.startState = 0;
    }
    findState(list, state) {
        var self = this;
        for (var i = 0; i < list.length; i++) {
            var s = list[i];
            if (s.length != state.length)
                continue;
            //check if every item in s is also in state
            var equals = true;
            for (var i1 = 0; i1 < s.length; i1++) {
                var item1 = s[i1];
                var found = state.filter(function (item2) {
                    return item2.equals(item1);
                }).length > 0;
                if (!found) {
                    equals = false;
                    break;
                }
            }
            if (equals)
                return i;
        }
        //we exited the loop, the state was not found
        return -1;
    }
    findSimilarState(list, state) {
        const self = this;
        for (var i = 0; i < list.length; i++) {
            var s = list[i];
            if (s.length != state.length)
                continue;
            //check if every item in s is also in state
            var equals = true;
            for (var i1 = 0; i1 < s.length; i1++) {
                var item1 = s[i1];
                var found = state.filter(function (item2) {
                    return item2.item.equals(item1.item);
                }).length > 0;
                if (!found) {
                    equals = false;
                    break;
                }
            }
            if (equals)
                return i;
        }
        //we exited the loop, the state was not found
        return -1;
    }
    mergeStates(j, state, other) {
        const self = this;
        state.forEach(function (lr1item) {
            if (lr1item.item.isAtEnd()) {
                var otherLR1item = other.filter(function (oLR1item) {
                    return oLR1item.item.equals(lr1item.item);
                })[0];
                //merge the lookahead of otherLR1item into the ones of lr1item
                var gitem = otherLR1item.item;
                var p = gitem.production;
                var lookahead = otherLR1item.lookahead;
                var pindex = self.productions.indexOf(p);
                var act = (self.action[j] = self.action[j] || {});
                if (!p.head.equals(self.S1)) {
                    var newAction = ['reduce', [self.symbolsTable[gitem.production.head.name], gitem.production.body.length, pindex]];
                    self.tryAddAction(act, gitem, lookahead, newAction);
                }
                else { //A == S'
                    act[EOF_INDEX] = ['accept', []];
                    self.actionTrack.set(act[EOF_INDEX], gitem);
                }
            }
        });
    }
    tryAddAction(act, gitem, lookahead, newAction) {
        const self = this;
        var an = self.symbolsTable[lookahead.toString()] || 0;
        // console.log(`tryAddAction ${lookahead} ${JSON.stringify(act)} ${an}`);
        if (act[an] === undefined) {
            act[an] = newAction;
        }
        else {
            //check if prod contains an operator and compare it to a
            act[an] = self.resolveConflict(act[an], newAction, lookahead, gitem, self.actionTrack.get(act[an]));
        }
        self.actionTrack.set(act[an], gitem);
    }
    getSymbols() {
        return this.nonTerminals.concat(this.terminals);
    }
    getConflictText(type, sym, gitem, conflict) {
        var cflStr = '';
        if (conflict)
            cflStr = `between ${gitem} and ${conflict}`;
        else
            cflStr = `in ${gitem}`;
        return `${type} conflict ${cflStr} on ${sym}`;
    }
    resolveConflict(currentAction, newAction, a, gitem, conflict) {
        //if current action is reduce we have a prod, otherwise?
        var shiftAction, reduceAction;
        var curtype = currentAction[0];
        var prod;
        if (curtype === 'reduce') {
            reduceAction = currentAction;
            if (newAction[0] == 'reduce') {
                if (newAction[1][0] != currentAction[1][0] || newAction[1][1] != currentAction[1][1]
                    || newAction[1][2] != currentAction[1][2]) {
                    throw new error_1.ParserError(this.getConflictText('Reduce/Reduce', a, gitem, conflict), [gitem, conflict]);
                }
                else {
                    return currentAction;
                }
            }
            else {
                shiftAction = newAction;
            }
        }
        else { //current is shift
            shiftAction = currentAction;
            if (newAction[0] === 'shift') {
                if (newAction[1][0] != currentAction[1][0]) {
                    throw new error_1.ParserError(this.getConflictText('Shift/Shift', a, gitem, conflict), [gitem, conflict]);
                }
                else {
                    return currentAction;
                }
            }
            else {
                //new Action is Reduce
                reduceAction = newAction;
            }
        }
        prod = this.productions[reduceAction[1][2]];
        //check if a is an operator
        const operators = this.operators;
        if (operators && operators[a.name]) {
            var aassoc = operators[a.name][0];
            var aprio = operators[a.name][1];
            //check if prod contains an operator
            var op = prod.body.filter(function (t) {
                return operators[t.name]; // isTerminal(t) && 
            })[0];
            if (op) {
                var redassoc = operators[op.name][0];
                var redprio = operators[op.name][1];
                //first check if it is the same priority
                if (aprio === redprio) {
                    //check associativity
                    if (redassoc === 'nonassoc') {
                        return ['error', [`Shift/Reduce conflict: Operator ${JSON.stringify(op)} is non-associative.`]];
                    }
                    else if (redassoc === 'left') {
                        //prefer reduce
                        return reduceAction;
                    }
                    else {
                        //prefer shift
                        return shiftAction;
                    }
                }
                else if (aprio > redprio) {
                    return shiftAction;
                }
                else { //aprio < redprio
                    return reduceAction;
                }
            }
            else {
            }
        }
        else {
            //a is not an operator
        }
        throw new error_1.ParserError(this.getConflictText('Shift/Reduce', a, gitem, conflict), [gitem, conflict]);
    }
    generateParsedGrammar() {
        const specs = this;
        return {
            action: specs.action,
            goto: specs.goto,
            actions: specs.actions,
            startState: specs.startState,
            symbolsTable: specs.symbolsTable,
            actionMode: specs.actionMode,
            symbols: specs.symbols,
        };
    }
}
exports.default = LRGenerator;
