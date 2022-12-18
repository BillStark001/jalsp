export interface Position {
    line: number;
    col: number;
}
export declare function getIncrementName(current: string): string;
export declare function getLinePositions(str: string): number[];
export declare function getLCIndex(str: string, pos: number, lineOneBased?: boolean, columnOneBased?: boolean): Position;
export declare function getLCIndex(record: number[], pos: number, lineOneBased?: boolean, columnOneBased?: boolean): Position;
