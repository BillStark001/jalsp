"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LR1Item = exports.GItem = exports.Production = void 0;
class Production {
    constructor(head, body) {
        this.head = head;
        this.body = body;
        this.dot = -1;
    }
    equals(obj) {
        if (!(obj instanceof Production))
            return false;
        if (this === obj)
            return true;
        if (!this.head.equals(obj.head) || this.body.length != obj.body.length)
            return false;
        for (var i = 0; i < this.body.length; ++i)
            if (!this.body[i].equals(obj.body[i]))
                return false;
        return true;
    }
    toString(dot) {
        var str = [];
        str.push(this.head.toString());
        str.push(' ::= ');
        for (var i = 0; i < this.body.length; i++) {
            if (i === dot)
                str.push('. ');
            str.push(this.body[i].toString());
            str.push(' ');
        }
        return str.join('').trim();
    }
    getItems() {
        if (this.items === undefined) {
            var self = this;
            self.items = Array.from(Array(self.body.length + 1).keys()).map(function (i) {
                return new GItem(self, i);
            });
        }
        return this.items;
    }
}
exports.Production = Production;
class GItem {
    constructor(prod, dot) {
        this.production = prod;
        this.dot = dot;
    }
    toString() {
        return this.production.toString(this.dot);
    }
    ;
    isAtStart() {
        return this.dot === 0;
    }
    ;
    isAtEnd() {
        return this.dot >= this.production.body.length;
    }
    ;
    symbolAhead() {
        return this.production.body[this.dot];
    }
    ;
    tail() {
        return this.production.body.slice(this.dot + 1, this.production.body.length);
    }
    ;
    nextItem() {
        return this.production.getItems()[this.dot + 1];
    }
    ;
    equals(other) {
        return other.production.equals(this.production) && other.dot === this.dot;
    }
    ;
}
exports.GItem = GItem;
class LR1Item {
    constructor(item, lookahead) {
        this.item = item;
        this.lookahead = lookahead;
    }
    toString() {
        return '[' + this.item.toString() + ', ' + this.lookahead.toString() + ']';
    }
    equals(other) {
        return this.item.equals(other.item) && this.lookahead.equals(other.lookahead);
    }
}
exports.LR1Item = LR1Item;
/*
export class LRRuleBook extends NDRuleBook<GSymbol> {

  constructor(rules: Rule<GSymbol>[]) {
    super(rules);
  }

  getSymbols(): GSymbol[] {
    var symbols: GSymbol[] = [];
    this.rules
      .filter(function (rule) {
        return ((rule.input !== eps)  && !(rule.input.negate));
      })
      .map(function (rule) {
        return rule.input as unknown as GSymbol;
      })
      .forEach(function (i) {
        if (!symbols.filter(s => s.match(i))) {
          symbols.push(i);
        }
      });

    return symbols;
  }

}
*/ 
