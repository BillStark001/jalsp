export const emptySet = new Set();

export const RETURN = '\n'; // '\r\n';


export const FIRSTCHAR = '\0';
export const LASTCHAR = '\uFFFF';


export interface IMatchable<T> {
  match(other: T): boolean;
  
}