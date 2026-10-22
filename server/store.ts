import {TASK_DURATION_MS} from '../src/taskRules.js';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, chmodSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash, randomBytes, randomInt } from 'node:crypto';
import type { Actor, Game, Identity } from './types.js';
import {defaultFloorPlan} from '../src/floorPlanRules.js';
import type {FloorPlan} from '../src/floorPlanRules.js';
import { financialTasks } from './puzzles.js';
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
export class Store {
  db: DatabaseSync;
  constructor(path:string) {
    if(path !== ':memory:') mkdirSync(dirname(path), {recursive:true,mode:0o700});
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
      CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, state TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS laptop_codes(laptop_id INTEGER PRIMARY KEY, code TEXT UNIQUE NOT NULL);
      CREATE TABLE IF NOT EXISTS credentials(hash TEXT PRIMARY KEY, session_id TEXT, actor TEXT NOT NULL, expires_at INTEGER);
      CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY, n INTEGER NOT NULL, at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS requests(session_id TEXT NOT NULL, actor TEXT NOT NULL, request_id TEXT NOT NULL, result TEXT NOT NULL, signature TEXT NOT NULL DEFAULT '', PRIMARY KEY(session_id,actor,request_id));`);
    if(!(this.db.prepare('PRAGMA table_info(requests)').all() as {name:string}[]).some(c=>c.name==='signature'))this.db.exec("ALTER TABLE requests ADD COLUMN signature TEXT NOT NULL DEFAULT ''");
    this.transaction(()=>{for(let id=1;id<=8;id++) {
      if(this.db.prepare('SELECT 1 FROM laptop_codes WHERE laptop_id=?').get(id))continue;
      let code:string;do{code=Array.from({length:4},()=>randomInt(6)).join('');}while(this.db.prepare('SELECT 1 FROM laptop_codes WHERE code=?').get(code));
      this.db.prepare('INSERT INTO laptop_codes VALUES(?,?)').run(id,code);
    }});
    if(path!==':memory:'){chmodSync(path,0o600);}
  }
  floorPlan():FloorPlan {
    const row=this.db.prepare("SELECT value FROM settings WHERE key='floor_plan'").get() as {value:string}|undefined;
    if(row)return JSON.parse(row.value);
    // One-time migration: retain the most recently created session's custom layout.
    const states=(this.db.prepare('SELECT state FROM sessions').all() as {state:string}[]).map(r=>JSON.parse(r.state)).sort((a,b)=>b.createdAt-a.createdAt);
    const plan=states.find(g=>g.floorPlan)?.floorPlan??defaultFloorPlan();this.setFloorPlan(plan);return plan;
  }
  setFloorPlan(plan:FloorPlan){this.db.prepare("INSERT INTO settings VALUES('floor_plan',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(JSON.stringify(plan));
    for(const row of this.db.prepare('SELECT id,state FROM sessions').all() as {id:string;state:string}[]){const state=JSON.parse(row.state);delete state.floorPlan;state.revision++;this.db.prepare('UPDATE sessions SET state=? WHERE id=?').run(JSON.stringify(state),row.id);}
  }
  laptopCodes():Record<number,string> {return Object.fromEntries((this.db.prepare('SELECT laptop_id,code FROM laptop_codes').all() as {laptop_id:number;code:string}[]).map(r=>[r.laptop_id,r.code]));}
  private read(state:string):Game {const g=JSON.parse(state) as Game;g.laptopCodes=this.laptopCodes();
    // Apply the requested timing update once, including existing sessions and paused deadlines.
    if((g.rulesVersion??0)<2){
      if(g.config.autoMeetingMs===180000){g.config.autoMeetingMs=240000;if(g.nextMeetingAt!==null)g.nextMeetingAt+=60000;}
      for(const t of g.thefts){const oldGap=t.alertAt-t.debitAt;if(!t.debited)t.debitAt+=25000;if(!t.alerted)t.alertAt+=oldGap===5000?20000:25000;}
      g.rulesVersion=2;
    }
    if((g.financeVersion??0)<1){for(const p of g.players)if(p.visualPractice){p.visualPractice.games=p.visualPractice.games?.filter(id=>![2,3,4,8,9,10].includes(id));p.visualPractice.wheel=false;}g.financeVersion=1;}
    g.floorPlan=this.floorPlan();g.taskCycles??={};g.taskSequences??={};g.taskDecks??={};
    if((g.rulesVersion??0)<4){for(const c of g.completions){const key=`${c.playerId}:${c.laptopId}`;c.cycle??=0;g.taskCycles[key]=Math.max(g.taskCycles[key]??0,c.cycle+1);g.assignments[c.playerId]=(g.assignments[c.playerId]??[]).filter(id=>id!==c.laptopId);if(g.taskProgress)delete g.taskProgress[key];}g.rulesVersion=4;}
    g.spinsThisRound??={};g.purchases??=[];g.config.autoEconomy??=false;g.jobs?.forEach(j=>{j.accepted=false;j.tease=true;if(j.stage==='accepted')j.stage='rejected';});
    g.taskProgress??={};g.terminalAttempts=(g.terminalAttempts??[]).filter(t=>t.puzzle);g.terminalAttempts.forEach(t=>{t.taskStage??=0;t.sequence??=[g.floorPlan.laptops.find(l=>l.id===t.laptopId)?.gameId??t.laptopId,13,14];if(t.kind==='task')g.taskSequences[`${t.playerId}:${t.laptopId}`]??=t.sequence;t.challengeId??=t.id;if(t.taskExpiresAt===undefined&&!t.practicePending){t.taskExpiresAt=t.expiresAt-270000;if(t.kind==='task')t.expiresAt=t.taskExpiresAt;}});for(const t of g.terminalAttempts){if(t.taskDurationMs===undefined){t.taskDurationMs=TASK_DURATION_MS;if(!t.practicePending&&t.taskExpiresAt!==undefined){t.taskExpiresAt+=TASK_DURATION_MS-30000;if(t.tutorialExpiresAt!==undefined)t.tutorialExpiresAt+=TASK_DURATION_MS-30000;if(t.kind==='task'&&t.tutorialPausedAt==null)t.expiresAt=t.taskExpiresAt;}}}g.config.theftAmount??=null;g.summary??=null;g.pendingSpin??=null;g.taskFailures??=[];g.jobs??=[];g.presence??={};g.lastGambles??={};g.players.forEach(p=>p.admitted??=true);g.tasks.forEach(t=>{const gameId=g.floorPlan.laptops.find(l=>l.id===t.id)?.gameId??t.id;const [icon,label]=financialTasks[gameId-1];Object.assign(t,{icon,label,module:`finance-${gameId}`});});return g;}
  all():Game[] {return (this.db.prepare('SELECT state FROM sessions').all() as {state:string}[]).map(r=>this.read(r.state));}
  get(code:string):Game|undefined {const row=this.db.prepare('SELECT state FROM sessions WHERE code=? OR id=?').get(code,code) as {state:string}|undefined; return row ? this.read(row.state) : undefined;}
  save(g:Game) {this.db.prepare('INSERT INTO sessions(id,code,state) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state').run(g.id,g.code,JSON.stringify((({floorPlan,...state})=>state)(g)));}
  deleteSession(id:string) {
    this.floorPlan();
    this.transaction(()=>{
      this.db.prepare('DELETE FROM credentials WHERE session_id=?').run(id);
      this.db.prepare('DELETE FROM requests WHERE session_id=?').run(id);
      this.db.prepare("DELETE FROM rate_limits WHERE instr(key,?)>0 OR key=?").run(`:${id}:`,`video:${id}`);
      this.db.prepare('DELETE FROM sessions WHERE id=?').run(id);
    });
  }
  clearSessions(){this.floorPlan();const count=this.all().length;this.transaction(()=>{this.db.prepare('DELETE FROM credentials WHERE session_id IS NOT NULL').run();this.db.prepare('DELETE FROM requests').run();this.db.prepare('DELETE FROM sessions').run();this.db.prepare('DELETE FROM rate_limits').run();});return count;}
  issue(actor:Actor, sessionId:string|null, expiresAt:number|null=null):string {
    const token=randomBytes(32).toString('base64url');
    this.db.prepare('INSERT INTO credentials VALUES(?,?,?,?)').run(hashToken(token),sessionId,JSON.stringify(actor),expiresAt);return token;
  }
  identify(token:string):Identity|null {const r=this.db.prepare('SELECT session_id,actor,expires_at FROM credentials WHERE hash=?').get(hashToken(token)) as {session_id:string|null;actor:string;expires_at:number|null}|undefined;
    if(!r || (r.expires_at!==null && r.expires_at<Date.now())) return null;
    return {sessionId:r.session_id,actor:JSON.parse(r.actor),expiresAt:r.expires_at ?? undefined};
  }
  revoke(token:string) {this.db.prepare('DELETE FROM credentials WHERE hash=?').run(hashToken(token));}
  cached(sessionId:string,actor:string,id:string) {const r=this.db.prepare('SELECT result,signature FROM requests WHERE session_id=? AND actor=? AND request_id=?').get(sessionId,actor,id) as {result:string;signature:string}|undefined;return r ? {result:JSON.parse(r.result),signature:r.signature} : undefined;}
  cache(sessionId:string,actor:string,id:string,result:unknown,signature:string) {this.db.prepare('INSERT INTO requests(session_id,actor,request_id,result,signature) VALUES(?,?,?,?,?)').run(sessionId,actor,id,JSON.stringify(result),signature);}
  snapshot():string {this.floorPlan();return JSON.stringify(Object.fromEntries(['settings','sessions','laptop_codes','credentials','requests','rate_limits'].map(table=>[table,this.db.prepare(`SELECT * FROM ${table}`).all()])));}
  restore(snapshot:string){const data=JSON.parse(snapshot);this.transaction(()=>{for(const table of ['settings','sessions','laptop_codes','credentials','requests','rate_limits']){this.db.prepare(`DELETE FROM ${table}`).run();const columns=(this.db.prepare(`PRAGMA table_info(${table})`).all() as {name:string}[]).map(c=>c.name);const insert=this.db.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(()=>'?').join(',')})`);for(const row of data[table]??[])insert.run(...columns.map(c=>row[c]??(c==='signature'?'':null)));}});}
  rateLimit(key:string,max:number,now=Date.now()):boolean {this.db.prepare('DELETE FROM rate_limits WHERE at<?').run(now-60000);this.db.prepare('DELETE FROM credentials WHERE expires_at IS NOT NULL AND expires_at<?').run(now);const r=this.db.prepare('SELECT n,at FROM rate_limits WHERE key=?').get(key) as {n:number;at:number}|undefined;const n=(r?.n??0)+1;this.db.prepare('INSERT INTO rate_limits VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET n=excluded.n').run(key,n,r?.at??now);return n<=max;}
  transaction<T>(fn:()=>T):T {this.db.exec('BEGIN IMMEDIATE');try {const v=fn();this.db.exec('COMMIT');return v;}catch(e){this.db.exec('ROLLBACK');throw e;}}
  close(){this.db.close();}
}
