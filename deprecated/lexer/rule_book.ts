import InputChar, { eps, findElementalIntervals, InputRange } from "./input_range";
import { IMatchable, RETURN } from "./defs";


var stateSeq = 1;

export class State {

  id?: number;
  label?: string;

  constructor(id?: number, label?: string) {
    if (id !== undefined) {
      this.id = id;
    } else {
      this.id = stateSeq++;
    }
    if (label !== undefined) {
      this.label = label;
    }
  }

  toString() {
    return (this.id || 0).toString();
  }
}

export class Target {

  states: State[];

  constructor(...args: State[]) {
    this.states = args;
  }

}


export class Rule<T> {

  state: State;
  input: IMatchable<T>;
  next: State;

  constructor(state: State, input: IMatchable<T>, next: State) {
    this.state = state;
    this.input = input;
    this.next = next;
  }

  appliesTo(state: State, input: T) {
    //return this.state == state && this.input == input;


    return this.state === state && this.input.match(input);
  }

  toString() {
    return this.state.toString() + '\t\t->\t\t' + this.input.toString() + '\t\t->\t\t' + this.next.toString();
  }

}

export class RuleBook<T> {

  rules: Rule<T>[];

  constructor(rules: Rule<T>[]) {
    this.rules = rules;
  }

  match(state: State, input: T) {

    var rets = this.rules.filter(function (rule) {
      return rule.appliesTo(state, input);
    });
    return rets.length > 0 ? rets[0] : undefined;
  };


  nextState(state: State, input: T) {
    var rule = this.match(state, input);
    if (rule === undefined) {
      //throw new Error('No transition on state ' + state + ' on input ' + input);
      return undefined;
    }
    return rule.next;
  }

  toString() {
    return this.rules.map(function (rule) {
      return rule.toString();
    }).join(RETURN);
  }

  getSymbols(): IMatchable<T>[] {

    var ranges =
      this.rules
        .filter(function (rule) {
          return ((rule.input !== eps) /* && !(rule.input.negate)*/);
        })
        .map(function (rule) {
          return rule.input;
        })
        .aggregate(function (ranges, s) {
          // TODO, HACK this may cause error.
          (s as any).appendRange(ranges);
          //s.push(ranges)
          return ranges;
        }, []);

    return ranges;
    // var elemental = findElementalIntervals(ranges);
    // return elemental;
  }
}

export class NDRuleBook<T> extends RuleBook<T> {
  constructor(rules: Rule<T>[]) {
    super(rules);
  }

  match2(states: State[], input: T) {
    var self = this;
    var rules = states.map(
      function (state) {
        return self.rules.filter(function (rule) {
          return rule.appliesTo(state, input);
        });
      }
    ).flatMap<Rule<T>[], Rule<T>>(x => x);

    return rules;
  }


  nextState(states: State[], input: T) {
    return this.match2(states, input).map(
      function (rule: Rule<T>) {
        return rule.next;
      }
    );
  }

}

export const mergeRule = function (rule: Rule<string | InputRange>, rules: Rule<string | InputRange>[]) {
  var existing = rules.filter(function (r) {
    return r.state === rule.state && r.next === rule.next;
  });
  if (existing.length > 0) {
    /*                console.log('merging existing '+existing.input.toDebug()
                    + ' with ' + rule.input.toDebug());*/
    if (typeof(existing[0].input) === 'string') {
      let s = existing[0].input as unknown as string;
      existing[0].input = new InputRange(s, s);
    }
    var rinput = rule.input;
    if (typeof(rinput) === 'string') {
      let rinput2 = rinput as unknown as string;
      rinput = new InputRange(rinput2, rinput2);
    }
    (existing[0].input as InputRange).append(rinput as InputRange);
    //                console.log('result: '+existing.input.toDebug());

  }
  else {
    rules.push(rule);
  }

};