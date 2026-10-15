import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Coins, DoorClosed, LockKeyhole, Monitor, RotateCw, ShieldCheck, Spade, UsersRound, Video, X } from 'lucide-react';
import { SymbolCode } from './Codes';
import { Avatar, RoleIcon } from './ui';
type Action=(name:string,data?:unknown)=>Promise<any>;

export function FinancialTask({terminal,action,disabled}:{terminal:any;action:Action;disabled:boolean}){
  const [error,setError]=useState(false),[busy,setBusy]=useState(false),[done,setDone]=useState(false),lock=useRef(false);
  useEffect(()=>{setDone(false);setError(false);},[terminal.id]);
  return <section className="financial-task"><div className="laptop-selected"><Avatar name={terminal.player?.name??''}/><h2>{terminal.player?.name}</h2></div><h3>{terminal.puzzle.title}</h3><p className="financial-equation">{terminal.puzzle.expression}</p>{done?<Check size={50}/>:<div className="puzzle-choices">{terminal.puzzle.choices.map((answer:number)=><button className="btn light" key={answer} disabled={disabled||busy} onClick={async()=>{if(lock.current)return;lock.current=true;setBusy(true);try{await action('terminal-confirm',{attemptId:terminal.id,answer});setDone(true);setError(false);}catch{setError(true);}finally{lock.current=false;setBusy(false);}}}>{answer}</button>)}</div>}{error&&<span role="alert" aria-label="Probeer opnieuw"><X size={26}/></span>}</section>;
}

export function TheftGame({s,action,disabled}:{s:any;action:Action;disabled:boolean}){
  const attempt=s.terminalAttempt,game=attempt?.theft;
  const [dial,setDial]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState(''),lock=useRef(false);
  useEffect(()=>setDial(0),[game?.nonce]);
  async function act(data:any){if(lock.current)return;lock.current=true;setBusy(true);try{const r=await action('steal',{attemptId:attempt.id,...data});setError(r.failed?'Buit verloren':'');}catch(e){setError((e as Error).message);}finally{lock.current=false;setBusy(false);}}
  if(!attempt||attempt.kind!=='theft')return null;
  const ready=!disabled&&!busy,max=game?.round>4;
  return <section className="theft-game"><button className="btn light icon-only" disabled={!ready} aria-label="Terminal loskoppelen" onClick={async()=>{try{await action('terminal-cancel');}catch(e){setError((e as Error).message);}}}><X/></button><div className="code-flow"><Monitor/><ArrowRight/><LockKeyhole/></div>{!game?<div className="puzzle-choices"><button className="btn light" disabled={!ready} onClick={()=>act({operation:'start',module:'lockpick'})}><LockKeyhole/> Lockpick</button><button className="btn light" disabled={!ready} onClick={()=>act({operation:'start',module:'diversion'})}><RotateCw/> Omleiding</button></div>:<><div className="theft-rounds" aria-label={`Ronde ${Math.min(4,game.round)} van 4`}>{[1,2,3,4].map(n=><span key={n} className={n<game.round?'complete':''}>{n<game.round?<Check/>:<LockKeyhole/>}</span>)}</div><div className="loot"><Coins/> {game.loot}</div>{!max&&<><div className="code-flow" aria-label={`${game.step} van ${game.module==='lockpick'?4:3} stappen voltooid`}>{Array.from({length:game.module==='lockpick'?4:3},(_,i)=>i<game.step?<Check key={i}/>:<span key={i}>○</span>)}</div>{game.module==='lockpick'?<div className="lock-dial"><SymbolCode code={String(game.target)}/><ArrowRight/><button className="btn light" disabled={!ready} aria-label="Draai het slot" onClick={()=>setDial(n=>(n+1)%6)}><SymbolCode code={String(dial)}/><RotateCw/></button></div>:<div className="pipe-puzzle" aria-label="Draai de leiding naar de uitgang"><div className="pipe-target" style={{transform:`rotate(${game.target*90}deg)`}}>↑</div><button disabled={!ready} aria-label="Leiding draaien" className="btn light" onClick={()=>setDial(n=>(n+1)%4)}><span style={{display:'inline-block',transform:`rotate(${dial*90}deg)`}}>↑</span><RotateCw/></button></div>}<button className="btn icon-only" disabled={!ready} aria-label="Stap bevestigen" onClick={()=>act({operation:'step',nonce:game.nonce,answer:dial})}><Check/></button></>}<button className="btn" disabled={!ready||game.loot===0} onClick={()=>act({operation:'cashout'})} aria-label="Verzamel opgebouwde buit"><Coins/><ArrowRight/></button></>}{error&&<p role="alert">{error}</p>}</section>;
}

export function GambleGame({s,action,disabled}:{s:any;action:Action;disabled:boolean}){
  const [stake,setStake]=useState(5),[busy,setBusy]=useState(false),[result,setResult]=useState<any>(null),[error,setError]=useState(''),lock=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
  return <div className="gamble-placeholder"><div className={`wheel-placeholder ${busy?'spinning':''}`} aria-label="Gokrad"><Spade size={56}/><div className="wheel-spokes"/></div><div className="loot"><Coins/>{s.gambler.balance}</div><label>Inzet<input type="number" min="1" max={s.gambler.balance} value={stake} onChange={e=>setStake(Number(e.target.value))}/></label><button className="btn" aria-label="Gokrad draaien" disabled={disabled||busy||!Number.isInteger(stake)||stake<1||stake>s.gambler.balance} onClick={async()=>{if(lock.current)return;lock.current=true;setBusy(true);setResult(null);setError('');try{const r=await action('gamble',{stake});timer.current=setTimeout(()=>{setResult(r);setBusy(false);lock.current=false;},1500);}catch(e){setError((e as Error).message);setBusy(false);lock.current=false;}}}><Spade/><RotateCw/></button>{result&&<div role="status" className="code-flow">{result.win?<Check/>:<X/>}<Coins/>{result.payout-result.stake}</div>}{error&&<p role="alert">{error}</p>}</div>;
}

export function Briefing({s,action,disabled=false}:{s:any;action?:Action;disabled?:boolean}){
  const [error,setError]=useState(false),[busy,setBusy]=useState(false);
  async function finish(){if(!action||busy||disabled)return;setBusy(true);try{await action('finish-briefing');setError(false);}catch{setError(true);}finally{setBusy(false);}}
  return <div className="briefing-player">{action&&s.introVideoUrl?<><video controls playsInline src={s.introVideoUrl} onEnded={finish} onError={()=>setError(true)}/><button className="btn" disabled={busy||disabled} onClick={finish} aria-label="Briefing afronden of overslaan"><ArrowRight/></button></>:<><Video size={70}/><Monitor size={45}/></>}{error&&<p role="alert">Video niet beschikbaar. Controleer de video-URL of ga verder met de pijl.</p>}</div>;
}

export function ResultSummary({s}:{s:any}){
  if(!s.summary)return null;
  return <section className="result-summary"><div className="code-flow"><ShieldCheck/><Coins/>{s.summary.companyCash}<Spade/>{s.summary.gamblerCash}</div>{s.summary.players.map((p:any)=><div className="summary-player" key={p.id}><Avatar small name={p.name}/><span>{p.name}</span><RoleIcon role={p.role} size={20}/>{p.dismissed&&<DoorClosed size={18}/>}<small>{p.completed}/{p.assigned}</small>{p.won?<Check size={18}/>:<X size={18}/>}</div>)}</section>;
}

const titles=['Koffie-architect','Muis-beweger','Bureauplantverzorger','Vergaderstoeltester','Excel-assistent','Kantoorkoerier','Papiermanager','Junior koffietester'];
const companies=['Bureau Morgen','Uitstel & Partners','Nieuwe Koers','Stil Werk B.V.'];
const rejections=['De vacature is inmiddels ingevuld.','We zoeken iemand met meer koffie-ervaring.','De functie is wegbezuinigd.','We hebben intern iemand gevonden.'];
export function InfiniteJobs({playerId}:{playerId:string}){
  const key=`fi-infinite-jobs-${playerId}`;
  const sentinel=useRef<HTMLDivElement>(null);
  const [count,setCount]=useState(8),[applications,setApplications]=useState<Record<string,string>>(()=>{try{return JSON.parse(localStorage.getItem(key)??'{}');}catch{return {};}});
  useEffect(()=>{localStorage.setItem(key,JSON.stringify(applications));},[applications,key]);
  useEffect(()=>{const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))setCount(n=>n+8);},{rootMargin:'100px'});if(sentinel.current)observer.observe(sentinel.current);return()=>observer.disconnect();},[count]);
  return <section className="job-search"><div className="job-heading"><UsersRound/><h2>Op zoek naar werk.</h2></div><div className="vacancy-feed">{Array.from({length:count},(_,i)=><button key={i} className={`vacancy ${applications[i]?'applied':''}`} onClick={()=>setApplications(prev=>prev[i]?prev:{...prev,[i]:rejections[Math.floor(Math.random()*rejections.length)]})}><h3>{titles[i%titles.length]}</h3><p>{companies[Math.floor(i/titles.length)%companies.length]}</p>{applications[i]?<p>{applications[i]}</p>:<span>Solliciteren <ArrowRight size={16}/></span>}</button>)}</div><div ref={sentinel} aria-hidden="true"/><button className="btn light full" onClick={()=>setCount(n=>n+8)}>Verder zoeken <ArrowRight/></button></section>;
}
