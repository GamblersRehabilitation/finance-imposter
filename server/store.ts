import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, chmodSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash, randomBytes, randomInt } from 'node:crypto';
import type { Actor, Game, Identity } from './types.js';
import { financialTasks } from './puzzles.js';
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
export class Store {
  db: DatabaseSync;
  constructor(path:string) {
    if(path !== ':memory:') mkdirSync(dirname(path), {recursive:true,mode:0o700});
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
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
  laptopCodes():Record<number,string> {return Object.fromEntries((this.db.prepare('SELECT laptop_id,code FROM laptop_codes').all() as {laptop_id:number;code:string}[]).map(r=>[r.laptop_id,r.code]));}
  private read(state:string):Game {const g=JSON.parse(state) as Game;g.laptopCodes=this.laptopCodes();g.terminalAttempts=(g.terminalAttempts??[]).filter(t=>t.puzzle);g.config.theftAmount??=null;g.summary??=null;g.presence??={};g.lastGambles??={};g.players.forEach(p=>p.admitted??=true);g.tasks.forEach((t,i)=>{if(t.module.endsWith('-placeholder')){t.module=`finance-${i+1}`;t.label=financialTasks[i][1];t.icon=financialTasks[i][0];}});return g;}
  all():Game[] {return (this.db.prepare('SELECT state FROM sessions').all() as {state:string}[]).map(r=>this.read(r.state));}
  get(code:string):Game|undefined {const row=this.db.prepare('SELECT state FROM sessions WHERE code=? OR id=?').get(code,code) as {state:string}|undefined; return row ? this.read(row.state) : undefined;}
  save(g:Game) {this.db.prepare('INSERT INTO sessions(id,code,state) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state').run(g.id,g.code,JSON.stringify(g));}
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
  snapshot():string {return JSON.stringify(Object.fromEntries(['sessions','laptop_codes','credentials','requests','rate_limits'].map(table=>[table,this.db.prepare(`SELECT * FROM ${table}`).all()])));}
  restore(snapshot:string){const data=JSON.parse(snapshot);this.transaction(()=>{for(const table of ['sessions','laptop_codes','credentials','requests','rate_limits']){this.db.prepare(`DELETE FROM ${table}`).run();const columns=(this.db.prepare(`PRAGMA table_info(${table})`).all() as {name:string}[]).map(c=>c.name);const insert=this.db.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(()=>'?').join(',')})`);for(const row of data[table]??[])insert.run(...columns.map(c=>row[c]??null));}});}
  rateLimit(key:string,max:number,now=Date.now()):boolean {this.db.prepare('DELETE FROM rate_limits WHERE at<?').run(now-60000);const r=this.db.prepare('SELECT n,at FROM rate_limits WHERE key=?').get(key) as {n:number;at:number}|undefined;const n=(r?.n??0)+1;this.db.prepare('INSERT INTO rate_limits VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET n=excluded.n').run(key,n,r?.at??now);return n<=max;}
  transaction<T>(fn:()=>T):T {this.db.exec('BEGIN IMMEDIATE');try {const v=fn();this.db.exec('COMMIT');return v;}catch(e){this.db.exec('ROLLBACK');throw e;}}
  close(){this.db.close();}
}
