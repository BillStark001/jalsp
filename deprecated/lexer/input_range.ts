import { FIRSTCHAR, IMatchable, LASTCHAR } from "./defs";

export default class InputChar implements IMatchable<string | InputChar> {

  character: string;

  constructor(character: string) {
    this.character = character;
  }
  //when match is called the object is the Rule's definition
  match(c: string | InputChar) {
    if (typeof c === 'string') {
      return this.character === c;
    }
    return c.matchChar(this);
    //return this.character === c;
  }
  //when matchRange and matchChar are called, the object is an actual input
  //and the argument is the Rule we are trying to match
  matchRange(range: InputRange) {
    return range.from <= this.character && this.character <= range.to;
  }
  matchChar(c: InputChar) {
    return this.character === c.character;
  }
  toString() {
    return this.character.toString();
  }
  isRange() {
    return false;
  }
  appendRange(ranges: InputRange[]) {
    ranges.push(new InputRange(this.character, this.character));
    return ranges;
  }
}


export class InputRange implements IMatchable<string | InputRange> {

  from: string;
  to: string;
  negate: boolean;

  next?: InputRange;

  constructor(from: string, to: string, negate?: boolean) {
    if (from <= to) {
      this.from = from;
      this.to = to;
    } else {
      this.from = to;
      this.to = from;
    }
    if (negate !== undefined) {
      this.negate = negate;
    } else {
      this.negate = false;
    }

  }

  clone(): InputRange {
    "use strict";
    var ret = new InputRange(this.from, this.to, this.negate);
    if (this.next) {
      ret.next = this.next.clone();
    }
    return ret;
  }

  //when match is called the object is the Rule's definition
  match(c: InputRange | string) {

    if (typeof c === 'string') {
      c = new InputRange(c, c);
    }
    if (c == eps) return false;

    return c.matchRange(this);

  }
  //when matchRange and matchChar are called, the object is an actual input
  //and the argument is the Rule we are trying to match
  //TODO: multiple negation are not Working!!!
  matchRange(range: InputRange): boolean {

    var result = false;
    if (range.from <= this.from && this.to <= range.to) {   //the input is comprised in the range
      //no need to check the other ranges
      return !range.negate;
    } else {
      //this input doesn't match the input
      //we must still check other ranges if available
      result = range.negate;
    }

    if (range.next)
      return this.matchRange(range.next);
    return result;
  }

  matchChar(c: InputChar): boolean {
    if (this.from === c.character && this.to === c.character)
      return true;
    if (this.next)
      return this.next.matchChar(c);
    return false;
  }

  toString() {
    return '[' + this.toStringInternal()
      + ']';
  }

  toDebug(): string {
    var str = this.from.charCodeAt(0) + ' - ' + this.to.charCodeAt(0);
    if (this.next !== undefined) {
      return str + ', ' + this.next.toDebug();
    } else return str;
  }

  //This toString is a bit complicated but helps debugging
  toStringInternal(): string {
    var str = '';
    if (this.from === FIRSTCHAR) {
      var lower: InputRange = this;
      var upper = lower.next;
      while (upper) {
        var a = String.fromCharCode(lower.to.charCodeAt(0) + 1);
        var b = String.fromCharCode(upper.from.charCodeAt(0) - 1);
        str = str + '^' + a + '-' + b;
        lower = upper;
        upper = lower.next;
      }

    }

    if (str.length === 0) {
      str = str + ((this.from < this.to) ? this.from + '-' + this.to : this.from);
      if (this.next) return str + this.next.toStringInternal();
    }
    return str;
  }

  compile(): string {
    var str = '';
    if (this.from === FIRSTCHAR) {
      var lower: InputRange = this;
      var upper = lower.next;
      while (upper) {
        /*                    var a = String.fromCharCode(lower.to.charCodeAt(0) + 1);
                        var b = String.fromCharCode(upper.from.charCodeAt(0) - 1);*/

        var a_ = lower.to.charCodeAt(0) + 1;
        var b_ = upper.from.charCodeAt(0) - 1;

        var a = String.fromCharCode(a_);
        var b = String.fromCharCode(b_);
        //str = str + '^'+a+'-'+b;
        //TODO: we could use char codes here.
        //str = str + "(c < " + JSON.stringify(a) + " && " + JSON.stringify(b) + " < c) ";
        if (str.length > 0) {
          str = str + " && ";
        }
        //str = str + "(c.charCodeAt(0) < "+ a + " || "+ b + " < c.charCodeAt(0)) ";
        str = str + "(c < " + JSON.stringify(a) + " || " + JSON.stringify(b) + " < c) ";
        lower = upper;
        upper = lower.next;
      }

    }


    if (str.length === 0) {
      //TODO: consider equals
      if (this.to === this.from) {
        str = str + '(' + JSON.stringify(this.from) + ' === c )';
      } else {
        str = str + "(" + JSON.stringify(this.from) + " <= c && c <= " + JSON.stringify(this.to) + ") ";
      }

      if (this.next) return str + ' || ' + this.next.compile();
    }


    return str;
  }

  isRange() {
    return true;
  }

  overlaps(other: InputRange) {
    return this.to >= other.from && this.from <= other.to;
  }

  append(range: InputRange) {
    //The append method is actually trying to merge multiple ranges into one, if possible
    //First check if one set is inside the other:
    if (this.from <= range.from && range.to <= this.to) {
      //the range to append is included in this, do nothing
      return;
    }
    if (range.from <= this.from && this.to <= range.to) {
      //it's the other way around
      this.from = range.from;
      this.to = range.to;
      return;
    }
    //check if the two ranges are head-to-tail (there should be no overlapping but better safe than sorry)
    if ((this.to === range.from) || (this.to.charCodeAt(0) + 1 === range.from.charCodeAt(0))) {
      this.to = range.to;

    } else if ((range.to === this.from) || (range.to.charCodeAt(0) + 1 === this.from.charCodeAt(0))) {
      this.from = range.from;
    }
    else if (!this.next) {
      this.next = range;
    }
    else {
      this.next.append(range);
    }

  }

  /*        getEnumerator (range) {
   var current = this;
   return {
   moveNext: function(){
   if(!current) return false;
   },
   getCurrent: function(){
   }
   }
   };*/

  appendRange(ranges: InputRange[]): InputRange[] {
    if (!this.negate) {
      ranges.push(this);
    } else {
      var lower = new InputRange(FIRSTCHAR, String.fromCharCode((this.from.charCodeAt(0) - 1)), true);
      var upper = new InputRange(String.fromCharCode((this.to.charCodeAt(0) + 1)), LASTCHAR, true);
      ranges.push(lower);
      ranges.push(upper);
    }
    if (this.next)
      return this.next.appendRange(ranges);
    return ranges;
  }

}

export class EpsilonRange extends InputRange {

  constructor() {
    super(FIRSTCHAR, FIRSTCHAR);

  }

  toString() {
    return 'ε'
  }
  match(c: InputRange) {
    return c instanceof EpsilonRange;
  }
  matchChar() { return false; }
  matchRange() { return false; }
  matchTerminal() { return false; }
  matchNonTerminal() { return false; }
  isRange() { return false; }
  appendRange(r: InputRange[]) {
    return r;
  }
}

export const eps = new EpsilonRange();



export interface RangePoint {
  val: string;
  dir: number;
}

export function findElementalIntervals(ranges: InputRange[]) {
  //computes a list of extremes
  if (ranges.length < 2) return ranges;
  var points: RangePoint[] = [];
  var intervals = [];
  var code;
  ranges.forEach(function (r) {
    points.push({ val: r.from, dir: +1 });
    points.push({ val: r.to, dir: -1 });
  });
  //sort them
  points.sort(function (a, b) {
    if (a.val < b.val) {
      return -1;
    }
    if (a.val > b.val) {
      return +1;
    }
    return (b.dir - a.dir);
  });
  var np = points.length - 1;
  var ni = 0;
  for (var i = 0; i < np; i++) {
    var cur = points[i], fol = points[i + 1];
    var from, to;
    ni += cur.dir; //we count the intervals along

    //+1 -1: [ ]
    //+1 +1: [ [
    //-1 -1: ] ]
    //-1 +1: ] [ (*)

    //TODO: guard against going overboard!
    if (cur.dir > 0) {
      from = cur.val;

    } else { //cur.dir<0
      if (cur.val === LASTCHAR) continue;
      //if(cur.val === LASTCHAR) cur.val = '\uFFFE'
      from = String.fromCharCode(cur.val.charCodeAt(0) + 1);
    }

    if (fol.dir > 0) {
      code = fol.val.charCodeAt(0);
      if (code === 0) continue;
      //if(code === 1) code = 1;
      to = String.fromCharCode(code - 1);
    } else { //fol.dir<0
      to = fol.val;
    }
    if (from <= to && (ni > 0 || cur.dir > 0 || fol.dir < 0)) {
      var newInt;

      //if(from<to)
      newInt = new InputRange(from, to);
      //else
      //    newInt= new InputChar(from);
      intervals.push(newInt);
    }

  }

  return intervals;
}

export function splitRanges(ranges: InputRange[]) {
  if (ranges.length < 2) return ranges;
  sortRanges(ranges);

  var i = 1;
  while (i < ranges.length) {
    if (ranges[i].from <= ranges[i - 1].to) {

      //calculate itersection
      var subs = intersectRanges(ranges[i - 1], ranges[i]);

      //remove the overlapping ranges
      ranges.splice(i - 1, 2);
      for (var j = subs.length - 1; j >= 0; j--) {
        ranges.splice(i - 1, 0, subs[j]);
      }
      sortRanges(ranges);


    } else {
      i++;
    }

  }

  return ranges;
}


export function intersectRanges(a: InputRange, b: InputRange) {
  var res: InputRange[] = [];
  var is = new InputRange(b.from, a.to < b.to ? a.to : b.to);
  res.push(is);
  var isless1 = String.fromCharCode(is.from.charCodeAt(0) - 1);
  if (a.from <= isless1) {
    res.push(new InputRange(a.from, isless1));
  }
  var isplus1 = String.fromCharCode(is.to.charCodeAt(0) + 1);

  var rx = a.to < b.to ? b.to : a.to;

  if (isplus1 <= rx) {
    res.push(new InputRange(isplus1, rx));
  }
  //sortRanges(res);
  return res;
}

export function sortRanges(ranges: InputRange[]) {
  ranges.sort(function (a, b) {
    if (a.from < b.from) {
      return -1;
    }
    if (a.from > b.from) {
      return 1;
    }
    //look right extreme
    if (a.to < b.to) {
      return -1;
    }
    if (a.to > b.to) {
      return 1;
    }
    return 0;
  });
}