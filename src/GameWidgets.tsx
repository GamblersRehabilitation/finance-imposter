import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Coins, DoorClosed, LockKeyhole, Monitor, RotateCw, Waypoints, ShieldCheck, Spade, UsersRound, Video, Smartphone, X, CircleHelp, ShoppingBag, Pause, Play, Hourglass, Hand } from 'lucide-react';
import { TheftControls } from './TheftControls';
import { cue } from './feedback';
import {SkillTutorial} from './SkillTutorial';
import { SymbolCode } from './Codes';
import { Avatar, RoleIcon, money } from './ui';
type Action=(name:string,data?:unknown)=>Promise<any>;

export { FinancialTask } from './FinancialTask';
export { GambleGame } from './GambleWheel';

export function TheftGame({s,action,disabled,now}:{now:number;s:any;action:Action;disabled:boolean}){
 const attempt=s.terminalAttempt,game=attempt?.theft;
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),lock=useRef(false),legacy=useRef<string|null>(null);
 async function act(data:any){if(lock.current)return;lock.current=true;setBusy(true);try{const r=await action('steal',{attemptId:attempt.id,...data});setError(r.failed?'Poging mislukt. Buit verloren; koppel opnieuw.':'');cue(r.failed?'error':'success');}catch(e){setError((e as Error).message);}finally{lock.current=false;setBusy(false);}}
 useEffect(()=>{if(!disabled&&attempt?.kind==='theft'&&(!game||game.version!==2)&&legacy.current!==attempt.id){legacy.current=attempt.id;void act({operation:game?'refresh':'start'});}},[attempt?.id,disabled]);

 if(!attempt||attempt.kind!=='theft')return null;
 const timedOut=game?.module==='diversion'&&game?.pipeDeadline&&now>=game.pipeDeadline;const ready=!disabled&&!busy&&!timedOut,max=game?.round>4;
 const tutorial=attempt.tutorialPausedAt!=null;
 async function teach(operation:'open'|'close'){if(lock.current)return;lock.current=true;setBusy(true);try{await action('terminal-tutorial',{attemptId:attempt.id,operation});setError('');cue('confirm');}catch(e){setError((e as Error).message);cue('error');}finally{lock.current=false;setBusy(false);}}
 return <section className="theft-game"><div className="theft-toolbar"><button className="btn light icon-only" disabled={disabled||busy} aria-label="Terminal loskoppelen" onClick={async()=>{try{await action('terminal-cancel');cue('back');}catch(e){setError((e as Error).message);}}}><X/></button>{game&&<button className="btn light icon-only" aria-label="Steelspeltutorial openen" disabled={disabled||busy||tutorial} onClick={()=>teach('open')}><CircleHelp/></button>}</div>{tutorial?<><span className="tutorial-paused" aria-label="Steelspeltimer gepauzeerd"><Pause/></span><SkillTutorial kind={game.module} disabled={disabled||busy} onClose={()=>teach('close')}/></>:<><h2 aria-label={game?.module==='lockpick'?'Slot kraken':'Geld omleiden'}>{game?.module==='lockpick'?<LockKeyhole/>:<Waypoints/>}</h2><div className="theft-rounds" aria-label={`Ronde ${Math.min(4,game?.round??1)} van 4`}>{[1,2,3,4].map(n=><span key={n} className={n<(game?.round??1)?'complete':''}>{n<(game?.round??1)?<Check/>:<LockKeyhole/>}</span>)}</div><div className="loot"><Coins/> {money(game?.loot??0)}</div>{!game?<span className="loader"/>:!max&&<TheftControls game={game} serverTime={attempt.tutorialPausedAt??now} disabled={!ready} onSubmit={payload=>act({operation:'step',nonce:game.nonce,...payload})}/>}<button className="btn" aria-label="Buit veilig innen" disabled={!ready||!game?.loot} onClick={()=>act({operation:'cashout'})}><Coins/><ArrowRight/><ShieldCheck/></button>{game?.loot>0&&<div className="risk-picture" aria-label="Nu innen of meer buit riskeren"><Coins/><ArrowRight/><ShieldCheck/><RotateCw/><LockKeyhole/></div>}</>}{error&&<div className="visual-error" role="alert" aria-label={error}><X/><RotateCw/></div>}</section>;
}

export function Briefing({s,action,disabled=false}:{s:any;action?:Action;disabled?:boolean}){
  const [error,setError]=useState(false),[busy,setBusy]=useState(false),[started,setStarted]=useState(false),video=useRef<HTMLVideoElement>(null);
  async function finish(){if(!action||busy||disabled)return;setBusy(true);try{await action('finish-briefing');setError(false);}catch{setError(true);}finally{setBusy(false);}}
  return <div className="briefing-player">{action&&s.introVideoUrl?<><video ref={video} controls muted playsInline preload="metadata" src={s.introVideoUrl} onPlay={()=>setStarted(true)} onEnded={finish} onError={()=>setError(true)}/>{!started&&<button className="btn" disabled={disabled} onClick={()=>{setError(false);void video.current?.play().catch(()=>setError(true));}}><Video/><Play/></button>}<button className="btn light" disabled={busy||disabled} onClick={finish} aria-label="Briefing afronden of overslaan"><ArrowRight/></button></>:<><Video size={70}/><Monitor size={45}/><div className="role-flow"><Smartphone/><ArrowRight/><Monitor/></div></>}{error&&<div className="visual-error" role="alert" aria-label="Video niet beschikbaar"><Video/><X/><ArrowRight/></div>}</div>;
}

export function ResultSummary({s}:{s:any}){
  if(!s.summary)return null;
  return <section className="result-summary"><div className="code-flow"><ShieldCheck/><Coins/>{money(s.summary.companyCash)}<Spade/>{money(s.summary.gamblerWealth??s.summary.gamblerCash)}</div>{s.summary.players.map((p:any)=><div className="summary-player" key={p.id}><Avatar small name={p.name}/><span>{p.name}</span><RoleIcon role={p.role} size={20}/>{p.dismissed&&<DoorClosed size={18}/>}<small>{p.completed}/{p.assigned}</small>{p.won?<Check size={18}/>:<X size={18}/>}</div>)}</section>;
}

export { InfiniteJobs } from './InfiniteJobs';
