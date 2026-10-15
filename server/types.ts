export type Role = 'manager' | 'security' | 'gambler' | 'employee';
export type Phase = 'lobby' | 'briefing' | 'playing' | 'paused' | 'ended';
export type MeetingPhase = 'idle' | 'gathering' | 'discussion' | 'dismissal';
export interface Config {
  playerCount: number; roles: Record<Role, number>; startCapital: number;
  companyGoal: number; gamblerGoal: number | null; theftAmount: number | null;
  autoMeetingMs: number; gatherMs: number; discussMs: number; cooldownMs: number;
  workerWin: 'dismiss' | 'dismiss-and-finance' | null;
  zeroCash: 'continue' | 'draw' | null;
  dismissedGambler: 'shares' | 'excluded' | null;
  moneyLaptops: number[]; testMode: boolean;
  introVideoUrl: string | null;
}
export interface Player { id: string; name: string; role: Role | null; dismissed: boolean; claimed: boolean; introSeen: boolean; checks: number; admitted: boolean }
export interface LaptopTask { id: number; icon: string; label: string; reward: number; module: string }
export interface Completion { playerId: string; laptopId: number; reward: number; at: number }
export interface Theft { id: string; playerId: string; laptopId: number; amount: number; collectedAt: number; debitAt: number; alertAt: number; debited: boolean; alerted: boolean; redCleared?:boolean }
export interface Investigation { id: string; playerId: string; laptopId: number; at: number; round: number; transactionTimes: number[]; failures?: number[] }
export interface Ledger { id: string; kind: string; amount: number; company: number; gamblers: number; at: number; detail: string }
export interface Puzzle { title: string; expression: string; choices: number[]; answer: number; kind?: string; instruction?: string; facts?: number[]; details?:Record<string,number|number[]> }
export interface TheftState {module:'lockpick'|'diversion';version?:2;round:number;step:number;loot:number;target:number;nonce:string;lock?:{startedAt:number;offset:number;speed:number;target:number;width:number};pipes?:import('../src/theftRules.js').PipeBoard}
export interface TerminalAttempt { id: string; playerId: string; laptopId: number; kind: 'task' | 'theft'; round: number; expiresAt: number; taskExpiresAt?:number; puzzle: Puzzle; theft?:TheftState }
export interface GameSummary { endedAt:number; companyCash:number; gamblerCash:number; players:{id:string;name:string;role:Role|null;dismissed:boolean;completed:number;assigned:number;won:boolean}[] }
export interface Presence {kind:Actor['kind'];playerId?:string;laptopId?:number;lastSeen:number}
export interface Game {
  rulesVersion?: number;
  id: string; code: string; title: string; revision: number; createdAt: number; phase: Phase; pausedAt: number | null;
  config: Config; players: Player[]; tasks: LaptopTask[]; assignments: Record<string, number[]>; completions: Completion[];
  laptopCodes: Record<number, string>; terminalAttempts: TerminalAttempt[];
  companyCash: number; gamblerCash: number; theftUnlocked: boolean;
  thefts: Theft[]; investigations: Investigation[]; ledger: Ledger[];
  meeting: {phase: MeetingPhase; source: 'automatic' | 'emergency' | 'admin' | null; startedAt: number | null; deadline: number | null; dismissedId: string | null};
  round: number; nextMeetingAt: number | null; cooldownUntil: number | null;
  lastDismissal: {playerId: string; name: string; role: Role; at: number} | null;
  winner: 'employees' | 'gamblers' | 'draw' | null; endReason: string | null;
  pendingSpin: {id:string;playerId:string;startedAt:number;endsAt:number;stake:number;segment:number;payout:number}|null; taskFailures:{id:string;attemptId:string;laptopId:number;at:number;playerId?:string;reason?:'answer'|'timeout';loss?:number;redCleared?:boolean}[]; jobs:JobApplication[];
  summary:GameSummary|null; presence:Record<string,Presence>; lastGambles:Record<string,{at:number;stake:number;payout:number;win:boolean;segment?:number;id?:string}>;
}
export type Actor = { kind: 'admin' } | {kind:'player'; playerId:string} | {kind:'board'|'emergency'|'laptop'; laptopId?:number};
export interface Identity { sessionId: string | null; actor: Actor; expiresAt?: number }
export class GameError extends Error { constructor(public code: string, message: string, public status = 400) {super(message);} }
export const ROLE_NAMES: Record<Role,string> = {manager:'Manager',security:'Beveiliger',gambler:'Gokker',employee:'Werknemer'};

export interface JobApplication {id:string;playerId:string;jobId:number;startedAt:number;checkedAt:number;finishedAt:number;tease:boolean;accepted:boolean;reason:string;stage:'checking'|'provisional'|'accepted'|'rejected'}
