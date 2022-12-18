import { RETURN } from "./defs";
import { eps, InputRange } from "./input_range";
import { NDRuleBook, Rule, RuleBook, State } from "./rule_book";

class Partition {

  part: State[][];
  ab: InputRange[];
  rb: RuleBook;

  constructor(part: State[][], ab: InputRange[], rb: RuleBook) {
    this.part = part;
    this.ab = ab;
    this.rb = rb;
  }

  /**
   * 
   * @param state 
   * @returns group number or -1
   */
  getGroup(state: State) {

    for (var i = 0; i < this.part.length; i++) {
      var j = this.part[i].indexOf(state);
      if (j >= 0) return i;
    }
    return -1;
  };

  partitionGroups() {
    var done = false;
    do {
      done = false;
      for (var i = 0, pl = this.part.length; i < pl; i++) {
        done = done || this.partitionGroup(i);
      }
    } while (done)

  };

  partitionGroup(i: number) {
    var group = this.part[i];
    var dg: { [index: number]: State[] };
    var self = this;
    var done = false;
    //debugger;
    for (var c = 0, abl = this.ab.length; c < abl; c++) {
      var inp = this.ab[c];
      dg = {};
      for (var j = 0; j < group.length; j++) {
        var st = self.rb.nextState(group[j], inp);
        //determine the group of this state st
        var g = self.getGroup(st!);
        //we store in dg the group in which the current input directs the state
        //dg[j] = g;
        //if(typeof(g) !== 'undefined')
        (dg[g] = dg[g] || []).push(group[j]);


      }
      //see if dg has more than one property
      var n = 0;
      for (var prop in dg) {
        n++
      }

      if (n > 1) {//we can distinguish some states
        //let's split group i:
        self.part.splice(i, 1);
        for (prop in dg) {
          self.part.splice(i, 0, dg[prop]);
        }
        done = true;
        break;
      }


    }
    return done;
  };

  isMinimal() {
    for (var i = 0, n = this.part.length; i < n; i++) {
      if (this.part[i].length > 1) return false;
    }
    return true;
  };
}

export type TokenTable = Map<State, number>;

export interface Specs {
  rulebook?: RuleBook,
  ndRuleBook?: NDRuleBook,  
  acceptstates: State[], 
  currentstate?: State, 
  startstate: State, 
  alphabet?: InputRange[], 
  tokenTable?: TokenTable, 
  secondaryTokenTable?: TokenTable, 
}

export interface CompileSpecs {
  className?: string;
  baseClass?: string;
}

export class DFA {

  rulebook: RuleBook; 
  acceptstates: Set<State>; 
  currentstate: State; 
  startstate: State; 
  alphabet: InputRange[]; 
  tokenTable: TokenTable; 
  secondaryTokenTable: TokenTable; 

  bol: boolean;
  logEnabled: boolean;

  source: string[];

  constructor(specs: Specs, logEnabled?: boolean) {
    //no specs, used as prototype?
    this.rulebook = specs.rulebook || new RuleBook([]);
    this.acceptstates = new Set(specs.acceptstates);
    this.currentstate = this.startstate = specs.startstate;
    this.alphabet = specs.alphabet || [];
    this.tokenTable = specs.tokenTable || new Map<State, number>;
    this.secondaryTokenTable = specs.secondaryTokenTable || new Map<State, number>;

    this.bol = false; // what does this do?
    this.logEnabled = logEnabled || false;
    this.source = [];
  }

  readSymbol(symbol: string | InputRange) {
    this.currentstate = this.rulebook.nextState(this.currentstate, symbol)!;
    return this;
  }

  nextState(state: State, symbol: string | InputRange) {
    return this.rulebook.nextState(state, symbol);
  }

  isAccepting() {
    var accepting = this.acceptstates.has(this.currentstate);
    if ((this.secondaryTokenTable.get(this.currentstate) === undefined)//means this rule is bol and no secondar available
      && !this.bol)
      accepting = false;
    return accepting;
  }

  isInDeadState() {
    return this.currentstate === undefined || this.currentstate === 0;
  }

  readString(str: string) {
    var self = this;
    if (str.length > 0) {
      /*junq(str).forEach(function (c) {
       self.readSymbol(c);
       });*/
      for (var i = 0, l = str.length; i < l; i++) {
        if (this.isInDeadState()) return;
        self.readSymbol(str.charAt(i));
      }
    }

  }

  getCurrentToken() {
    if (this.tokenTable !== undefined) {
      var token = this.tokenTable.get(this.currentstate);
      var secondary = this.secondaryTokenTable.get(this.currentstate);
      if (secondary !== undefined) {
        //means token is bol
        if (this.bol) return token;
        else return secondary;
      }
      return token;
    }
  }

  reset(state?: State) {
    this.currentstate = state || this.startstate;
    this.bol = false;
    return this;
  }

  getRules() {
    return this.rulebook.rules;
  }

  getStatesWithTransisions() {
    return new Set(this.rulebook.rules
      .map(function (rule) {
        return rule.state;
      }));
  }

  getStates() {
    return new Set(this.rulebook.rules
      .flatmap(function (rule: Rule) {
        return [rule.state, rule.next];
      }));
  }

  matches(str: string) {
    this.reset();
    this.readString(str);
    return this.isAccepting();
  }

  toString() {
    return "startstate: " + this.startstate.toString() + '\t\t\t\t' +
      "acceptstates: " + this.acceptstates.toString() + RETURN +
      "currentstate: " + (this.currentstate ? this.currentstate.toString() : '∅') + '\t\t\t accepting: ' + this.isAccepting() + RETURN +
      '*************** Rules *********************\r\n' +
      'From\tinput\tTo\r\n' +
      this.rulebook.toString() +
      "\r\n********************************";
  };

  invert() {
    var start: State;
    var invertedRules = this.getRules()
      .map(function (rule) {
        return new Rule(rule.next, rule.input, rule.state);
      });
    /*if(this.acceptstates.length>1)*/
    {
      start = new State();
      invertedRules = invertedRules.concat(Array.from(this.acceptstates).map(function (as) {
        return new Rule(start, eps, as);
      }))
        .concat(Array.from(this.acceptstates).map(function (as) {
          return new Rule(as, eps, start);
        }));
    }
    /*else {
     start = this.acceptstates;
     }*/
    // invertedRules = invertedRules.toArray();
    var acceptstates = [this.startstate];
    var invNFA = new NFA({
      ndRuleBook: new NDRuleBook(invertedRules),
      acceptstates: acceptstates, 
      startstate: start, 
    });
    if (this.logEnabled) {
      console.log(invNFA.toString());
    }
    return invNFA.toDFA();
  };

  minimize() {
    var self = this;
    //start with a partition accepting, non accepting
    var part = [];
    //group 0 is non final states
    part[0] = Array.from(this.getStates().deleteSet(new Set(this.acceptstates)));
    //we have to distinguish finals by their token id
    var tg: { [tid: number]: State[] } = [];

    this.acceptstates.forEach(as => {
      var tokenid = this.tokenTable.get(as) || -1;
      (tg[tokenid] = tg[tokenid] || []).push(as);
    });

    for (var prop in tg) {
      part.push(tg[prop]);
    }
    //part[1] = this.acceptstates;
    var ab = this.alphabet;
    //var ab = this.rulebook.getSymbols();
    var pm = new Partition(part, ab, this.rulebook);
    pm.partitionGroups();
    if (!pm.isMinimal()) {
      //gets the partitions and mess with the states
      part.filter(function (group) {
        return group.length > 1;
      })
        .forEach(function (group) {
          self.identifyStates(group[0], group.slice(1))
        });
    }
  };

  identifyStates(representative: State, others: State[]) {
    var self = this;
    //we can make all of s2’s
    //incoming edges point to s1 instead and delete s2
    //that is s -> input -> S2 becomes
    //        a -> input -> S1
    // and we delete all s2 -> *
    others.forEach(function (s2) {
      self.getRules().filter(function (rule) {
        return rule.next === s2
      })
        .forEach(function (rule) {
          rule.next = representative;
        });
      self.rulebook.rules = self.getRules().filter(function (rule) {
        return rule.state !== s2;
      });
    });

  };

  compileBase(classname?: string) {
    this.source = [];
    var specs = { className: classname || 'CDFAbase' };
    this.compileCtor(specs);
    this.compilStdMethods(specs);
    //this.compileStateSwitch(specs);
    return this.source.join('');
  };

  compile(specs: CompileSpecs) {
    this.source = [];

    //this.emit('function (){\r\n');

    specs = specs || {};
    specs.className = specs.className || 'CDFA';
    specs.baseClass = specs.baseClass || 'CDFAbase';
    this.compileCtor(specs);

    this.emit(specs.className + '.prototype= new ' + specs.baseClass + '();\n')

    this.compileStateSwitch(specs);

    //this.emit('return new '+specs.className +'();\r\n');
    //this.emit('}');
    return this.source.join('');
  };

  emit(code: string) {
    this.source.push(code);
  };

  compileCtor(specs: CompileSpecs) {
    this.emit('function ' + specs.className + '(){\n\tthis.ss=');
    this.emit(this.startstate + ';\n\tthis.as=');
    this.emit(JSON.stringify(this.acceptstates) + ';\n\tthis.tt=');
    this.emit(JSON.stringify(this.tokenTable) + ';\n');
    var stt: { [id: number]: State } = {};
    if (this.secondaryTokenTable !== undefined) {
      
      // assume this is correct...
      this.secondaryTokenTable.forEach((v, k) => {
        if (v >= 0)
          stt[v] = k;
      });

      /*
      for (var i = 0; i < this.secondaryTokenTable.size; i++) {
        if (this.secondaryTokenTable[i] !== undefined) {
          stt[i] = this.secondaryTokenTable[i];
        }
      }
      */
    }
    this.emit('this.stt=' + JSON.stringify(stt) + ';\n');

    this.emit('}\n');
  };

  compilStdMethods(specs: CompileSpecs) {
    this.emit(specs.className + ".prototype.reset = function (state) {\n\tthis.cs = state || \tthis.ss;\nthis.bol=false;\n};\n" +
      specs.className + ".prototype.readSymbol = function (c) {\n\tthis.cs = this.nextState(this.cs, c);\n};\n" +
      specs.className + ".prototype.isAccepting = function () {\n\tvar acc = this.as.indexOf(this.cs)\x3E=0;\nif((this.stt[this.cs]===-1)&&!this.bol){\nacc=false;}\nreturn acc;};\n" +
      specs.className + ".prototype.isInDeadState = function () {\n\treturn this.cs === undefined || this.cs === 0;\n};\n" +
      specs.className + ".prototype.getCurrentToken = function(){\n\tvar t= this.tt[this.cs];\nvar s=this.stt[this.cs];\nif(s!==undefined){return this.bol?t:s;}\nreturn t;};\n"

    );
  };

  compileStateSwitch(specs: CompileSpecs) {
    this.emit(specs.className + '.prototype.nextState = function(state, c){\n    var next = 0;\n    switch(state){\n');
    var self = this, rules, i, rl;
    this.getStatesWithTransisions().forEach(function (state) {
      self.emit('case ' + state + ':\n');
      rules = self.rulebook.rules.filter(function (rule) { return rule.state === state; });
      for (i = 0, rl = rules.length; i < rl; i++) {
        self.emit('if(');
        self.compileRule(rules[i]);

        self.emit('){\n');

        self.emit('next = ' + rules[i].next);

        self.emit(';\n}');
        if (i < rl - 1) {
          self.emit(' else ');
        }
      }

      self.emit('\nbreak;\n')
    });
    this.emit('\t}\n\treturn next;\n};\n');
  };

  compileRule(rule: Rule) {
    var str = rule.input.compile();
    this.emit(str);
  };


}

export class NFA extends DFA {

  ndRuleBook: NDRuleBook;

  constructor(specs: Specs) {
    super(specs);
    //ensure acceptstates and startstatesì are set
    this.startstate = specs.startstate;
    this.currentstate = this.epsClosure(this.startstate);
    this.ndRuleBook = specs.ndRuleBook || new NDRuleBook([]);
  }

  readSymbol(symbol: string | InputRange) {

    //this.currentstate = new sets.Set(this.rulebook.nextState(this.currentstate, symbol));
    //this.currentstate = this.epsClosure(this.currentstate);
    this.currentstate = this.lexEdge(this.currentstate, symbol);
    return this;
  };

  lexEdge(state: State[], symbol: string | InputRange) {
    var states = new Set(this.ndRuleBook.nextState(state, symbol));
    state = this.epsClosure(states);
    return state;
  };

  isAccepting() {
    return !this.currentstate.intersect(this.acceptstates).isEmpty();
  };


  epsClosure2(state) {
    //finds all state reached from current state(s) with epsilon moves
    var S = state;
    if (!sets.isSet(S)) S = new sets.Set(S);
    do {
      var S1 = S.clone();
      S = new sets.Set(this.rulebook.nextState(S1, automata.eps)).union(S1);
    }
    while (!S.equalTo(S1));


    return S;
  };

  epsClosure(state) {
    state = sets.isSet(state) ? state : new sets.Set(state);
    var states = state.toArray();
    var eps = state.clone();
    while (states.length > 0) {
      var t = states.pop();
      this.rulebook.nextState(t, automata.eps).forEach(function (u) {
        if (!eps.contains(u)) {
          eps.add(u);//TODO: avoid having to check twice for u being in the set
          states.push(u);
        }


      });
    }
    return eps;
  };

  reset(state) {
    this.currentstate = this.epsClosure(state || this.startstate);
    return this;
  };

  //junq(symbols2).forEach(function(s){console.log(s.from.charCodeAt(0)+'-'+s.to.charCodeAt(0));})


  toDFA() {
    var lex;
    var rb;
    var j, self, nstates;
    var startstate;\
    var acceptstates;
    var states = [];
    var tokentable = [];
    var secondarytokentable = [];
    states[0] = emptySet;
    states[1] = this.epsClosure(this.startstate);
    var rules: Rule[] = [];
    startstate = 1;
    acceptstates = [];
    j = 1;
    self = this;
    var ab = this.alphabet;
    /*                junq(ab).forEach(function(s){console.log(s.from.charCodeAt(0)+'-'+s.to.charCodeAt(0));})
                ab = this.rulebook.getSymbols();
                junq(ab).forEach(function(s){console.log(s.from.charCodeAt(0)+'-'+s.to.charCodeAt(0));})*/
    while (j < states.length) {

      junq(ab).forEach(function (c) {
        var next;
        var e = self.lexEdge(states[j], c);

        next = undefined;
        for (var i = 0, sl = states.length; i < sl; i++) {
          if (e.equalTo(states[i])) { // we must use sets equality
            next = i;
            break;
          }
        }
        if (next === undefined) {
          next = states.push(e) - 1;
        }

        //add transition if not to the empty state
        if (next > 0) {
          //clone input because merge rule will actually modify the ranges concatenating them.
          //This could cause infinite loops if a range is reinserted in a different position
          var cc = c.clone !== undefined ? c.clone() : c;
          var rule = new Rule(j, cc, next);

          mergeRule(rule, rules);
          if (this.logEnabled)
            console.log(rule.toString());
        }
      });
      j++;
    }
    nstates = states.length;
    for (var i = 1; i < nstates; i++) {

      /*
      var final = junq(this.acceptstates).first(function(as){
          "use strict";
          return states[i].contains(as);
      });
      */
      var acceptStates = junq(this.acceptstates).where(function (as) {
        return states[i].contains(as);
      }).toArray();
      var final = acceptStates[0];

      var secondary = junq(acceptStates.slice(1)).first(function (as) {
        return !(as.bol);
      });
      //var finals = states[i].intersect(this.acceptstates);
      if (final !== undefined) {
        //this state contains at least one accept state.
        //Here we take the higher in rank
        acceptstates.push(i);
        tokentable[i] = final.tokenid;
        if (final.bol) {//the corresponding rule is matched only at begginning-of-line
          secondarytokentable[i] = secondary ? secondary.tokenid : -1;
        }
      }
    }

    rb = new RuleBook(rules);
    var ret: Specs = {
      rulebook: rb,
      acceptstates: acceptstates,
      startstate: startstate,
      tokenTable: tokentable,
      secondaryTokenTable: secondarytokentable,
      statesTable: states
    };

    //automata = new DFA(specs);
    //automata.tokenTable = tokentable;
    /*            if(this.logEnabled) {
                for (i = 0; i < states.length; i++) {
                    console.log('Dstate ' + i + ' corresponds to NFA states ' + states[i].toString());
                }
            }
            if(specs.savestates){
                automata.statesTable = states;
            }*/
    return ret;
  };


}