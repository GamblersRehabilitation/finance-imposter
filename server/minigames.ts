/** Only registered, server-verified adapters may award money. Placeholders never accept client success flags. */
export interface TaskAdapter { id:string; verify(proof:unknown, context:{sessionId:string;playerId:string;laptopId:number}):boolean }
export const taskAdapters = new Map<string,TaskAdapter>();
export const theftModules = {
  lockpick:{id:'lockpick',status:'placeholder',successesPerRound:4,multipliers:[1,2,3,4],baseLoot:null},
  diversion:{id:'diversion',status:'placeholder',successesPerRound:3,multipliers:[1,2,3,4],baseLoot:null},
} as const;
export interface GamblingAdapter { id:string; resolve(proof:unknown):{stake:number;payout:number}|null }
export const gamblingAdapters = new Map<string,GamblingAdapter>();
