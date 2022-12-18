"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EOFNUM = exports.eof = exports.eps = exports.isNonTerminal = exports.isTerminal = exports.EpsilonSymbol = exports.T = exports.NT = exports.GSymbol = void 0;
class GSymbol {
    constructor(name) {
        this.name = name;
    }
    toString() {
        return this.name;
    }
    equals(x) {
        if (this instanceof EpsilonSymbol && x instanceof EpsilonSymbol) {
            return true;
        }
        if (this instanceof T && x instanceof T) {
            return this.name === x.name;
        }
        if (this instanceof NT && x instanceof NT) {
            return this.name === x.name;
        }
        return false;
    }
}
exports.GSymbol = GSymbol;
class NT extends GSymbol {
    match(other) {
        return other.matchNonTerminal(this);
    }
    matchTerminal(other) {
        return false;
    }
    matchNonTerminal(other) {
        return other.name === this.name;
    }
    clone() {
        return new NT(this.name);
    }
    toString() {
        return '<<' + this.name + '>>';
    }
}
exports.NT = NT;
class T extends GSymbol {
    match(other) {
        return other.matchTerminal(this);
    }
    matchTerminal(other) {
        return other.name === this.name;
    }
    matchNonTerminal(other) {
        return false;
    }
    clone() {
        return new T(this.name);
    }
}
exports.T = T;
class EpsilonSymbol extends T {
    constructor() {
        super("ε");
    }
    match(other) {
        return this.matchTerminal(other);
    }
    matchTerminal(other) {
        return other instanceof EpsilonSymbol;
    }
    matchNonTerminal(other) {
        return false;
    }
    clone() {
        return this;
    }
}
exports.EpsilonSymbol = EpsilonSymbol;
function isTerminal(e) {
    return e instanceof T;
}
exports.isTerminal = isTerminal;
function isNonTerminal(e) {
    return e instanceof NT;
}
exports.isNonTerminal = isNonTerminal;
exports.eps = new EpsilonSymbol();
exports.eof = new T('<<EOF>>');
exports.EOFNUM = 0;
