export type Role = 'manager' | 'security' | 'gambler' | 'employee';
export type Phase = 'lobby' | 'playing' | 'paused' | 'ended';
export type MeetingPhase = 'idle' | 'gathering' | 'discussion';
export interface Config {
  playerCount: number; roles: Record<Role, number>; startCapital: number;
  companyGoal: number; gamblerGoal: number | null;
  autoMeetingMs: number; gatherMs: number; discussMs: number; cooldownMs: number;
  workerWin: 'dismiss' | 'dismiss-and-finance' | null;
  zeroCash: 'continue' | 'draw' | null;
  dismissedGambler: 'shares' | 'excluded' | null;
  moneyLaptops: number[]; testMode: boolean;
  introVideoUrl: string | null;
}
export interface Player { id: string; name: string; role: Role | null; dismissed: boolean; claimed: boolean; introSeen: boolean; checks: number }
export interface LaptopTask { id: number; icon: string; label: string; reward: number; module: string }
export interface Completion { playerId: string; laptopId: number; reward: number; at: number }
export interface Theft { id: string; playerId: string; laptopId: number; amount: number; collectedAt: number; debitAt: number; alertAt: number; debited: boolean; alerted: boolean }
export interface Investigation { id: string; playerId: string; laptopId: number; at: number; round: number; transactionTimes: number[] }
export interface Ledger { id: string; kind: string; amount: number; company: number; gamblers: number; at: number; detail: string }
export interface Game {
  id: string; code: string; title: string; revision: number; createdAt: number; phase: Phase; pausedAt: number | null;
  config: Config; players: Player[]; tasks: LaptopTask[]; assignments: Record<string, number[]>; completions: Completion[];
  companyCash: number; gamblerCash: number; theftUnlocked: boolean;
  thefts: Theft[]; investigations: Investigation[]; ledger: Ledger[];
  meeting: {phase: MeetingPhase; source: 'automatic' | 'emergency' | 'admin' | null; startedAt: number | null; deadline: number | null; dismissedId: string | null};
  round: number; nextMeetingAt: number | null; cooldownUntil: number | null;
  lastDismissal: {playerId: string; name: string; role: Role; at: number} | null;
  winner: 'employees' | 'gamblers' | 'draw' | null; endReason: string | null;
}
export type Actor = { kind: 'admin' } | {kind:'player'; playerId:string} | {kind:'board'|'emergency'|'laptop'; laptopId?:number};
export interface Identity { sessionId: string | null; actor: Actor; expiresAt?: number }
export class GameError extends Error { constructor(public code: string, message: string, public status = 400) {super(message);} }
export const ROLE_NAMES: Record<Role,string> = {manager:'Manager',security:'Beveiliger',gambler:'Gokker',employee:'Werknemer'};
