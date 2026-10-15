/** Only registered, server-verified adapters may award money. Placeholders never accept client success flags. */
export interface TaskAdapter { id:string; verify(proof:unknown, context:{sessionId:string;playerId:string;laptopId:number}):boolean }
export const taskAdapters = new Map<string,TaskAdapter>();
export const theftModules = {
  lockpick:{id:'lockpick',status:'ready',successesPerRound:4,multipliers:[1,2,3,4],baseLoot:'configured'},
  diversion:{id:'diversion',status:'ready',successesPerRound:3,multipliers:[1,2,3,4],baseLoot:'configured'},
} as const;
export interface GamblingAdapter { id:string; resolve(proof:unknown):{stake:number;payout:number}|null }
export const gamblingAdapters = new Map<string,GamblingAdapter>();
