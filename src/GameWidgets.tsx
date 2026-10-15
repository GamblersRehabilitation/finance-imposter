import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Coins, DoorClosed, LockKeyhole, Monitor, RotateCw, Waypoints, ShieldCheck, Spade, UsersRound, Video, X } from 'lucide-react';
import { TheftControls } from './TheftControls';
import { cue } from './feedback';
import { SymbolCode } from './Codes';
import { Avatar, RoleIcon, money } from './ui';
type Action=(name:string,data?:unknown)=>Promise<any>;

export { FinancialTask } from './FinancialTask';
export { GambleGame } from './GambleWheel';

export function TheftGame({s,action,disabled}:{s:any;action:Action;disabled:boolean}){
 const attempt=s.terminalAttempt,game=attempt?.theft;
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),lock=useRef(false),legacy=useRef<string|null>(null);
 async function act(data:any){if(lock.current)return;lock.current=true;setBusy(true);try{const r=await action('steal',{attemptId:attempt.id,...data});setError(r.failed?'Poging mislukt. Buit verloren; koppel opnieuw.':'');cue(r.failed?'error':'success');}catch(e){setError((e as Error).message);}finally{lock.current=false;setBusy(false);}}
 useEffect(()=>{if(!disabled&&attempt?.kind==='theft'&&(!game||game.version!==2)&&legacy.current!==attempt.id){legacy.current=attempt.id;void act({operation:game?'refresh':'start'});}},[attempt?.id,disabled]);
 if(!attempt||attempt.kind!=='theft')return null;
 const ready=!disabled&&!busy,max=game?.round>4;
 return <section className="theft-game"><button className="btn light icon-only" disabled={!ready} aria-label="Terminal loskoppelen" onClick={async()=>{try{await action('terminal-cancel');}catch(e){setError((e as Error).message);}}}><X/></button><h2>{game?.module==='lockpick'?<><LockKeyhole/> Slot kraken</>:<><Waypoints/> Geld omleiden</>}</h2><p className="play-help">Willekeurig toegewezen · ronde {Math.min(4,game?.round??1)} / 4</p><div className="theft-rounds" aria-label={`Ronde ${Math.min(4,game?.round??1)} van 4`}>{[1,2,3,4].map(n=><span key={n} className={n<(game?.round??1)?'complete':''}>{n<(game?.round??1)?<Check/>:<LockKeyhole/>}</span>)}</div><div className="loot"><Coins/> {money(game?.loot??0)}</div>{!game?<p>Beveiliging controleren…</p>:!max&&<TheftControls game={game} serverTime={s.pausedAt??s.serverTime} disabled={!ready} onSubmit={payload=>act({operation:'step',nonce:game.nonce,...payload})}/>}<button className="btn" disabled={!ready||!game?.loot} onClick={()=>act({operation:'cashout'})}><Coins/> Buit innen <ArrowRight/></button>{game?.loot>0&&<p className="play-help">Nu innen of nog een ronde riskeren. Een fout verliest alle opgebouwde buit.</p>}{error&&<p role="alert">{error}</p>}</section>;
}

export function Briefing({s,action,disabled=false}:{s:any;action?:Action;disabled?:boolean}){
  const [error,setError]=useState(false),[busy,setBusy]=useState(false),[started,setStarted]=useState(false),video=useRef<HTMLVideoElement>(null);
  async function finish(){if(!action||busy||disabled)return;setBusy(true);try{await action('finish-briefing');setError(false);}catch{setError(true);}finally{setBusy(false);}}
  return <div className="briefing-player">{action&&s.introVideoUrl?<><video ref={video} controls playsInline preload="metadata" src={s.introVideoUrl} onPlay={()=>setStarted(true)} onEnded={finish} onError={()=>setError(true)}/>{!started&&<button className="btn" disabled={disabled} onClick={()=>{setError(false);void video.current?.play().catch(()=>setError(true));}}><Video/> Start briefingvideo</button>}<button className="btn light" disabled={busy||disabled} onClick={finish} aria-label="Briefing afronden of overslaan">Verder <ArrowRight/></button></>:<><Video size={70}/><Monitor size={45}/><p>Bekijk de briefing op het digibord.</p></>}{error&&<p role="alert">Video niet beschikbaar. Controleer de MP4-upload of ga verder met de pijl.</p>}</div>;
}

export function ResultSummary({s}:{s:any}){
  if(!s.summary)return null;
  return <section className="result-summary"><div className="code-flow"><ShieldCheck/><Coins/>{s.summary.companyCash}<Spade/>{s.summary.gamblerCash}</div>{s.summary.players.map((p:any)=><div className="summary-player" key={p.id}><Avatar small name={p.name}/><span>{p.name}</span><RoleIcon role={p.role} size={20}/>{p.dismissed&&<DoorClosed size={18}/>}<small>{p.completed}/{p.assigned}</small>{p.won?<Check size={18}/>:<X size={18}/>}</div>)}</section>;
}

export { InfiniteJobs } from './InfiniteJobs';
