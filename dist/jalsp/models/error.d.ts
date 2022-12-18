export declare class LexerError extends Error {
    additional?: any;
    constructor(msg: string, additional?: any);
}
export declare class ParserError extends Error {
    additional?: any;
    constructor(msg: string, additional?: any);
}
