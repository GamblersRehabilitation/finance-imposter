import {usePageIdentity} from './pageIdentity';
import { useState } from 'react';
import { ArrowRight, BellRing, Hourglass, Infinity as InfinityIcon, Monitor, Smartphone, UsersRound } from 'lucide-react';
import { useGame, useServerNow } from './api';
import { Avatar, Brand, Icon, MeetingOverlay, MoneyBar, MoneyStatus, Ring, RoleIcon } from './ui';
import { BoardLobby } from './Lobby';
import { EndScene } from './Player';
import { SymbolCode } from './Codes';
import { FinancialTask, Briefing, ResultSummary } from './GameWidgets';
function readToken(kind:string,code:string,id?:number){const key=`fi-device-${kind}-${code}-${id??''}`,token=new URLSearchParams(location.search).get('key');if(token){localStorage.setItem(key,token);history.replaceState({},'',location.pathname);}return localStorage.getItem(key);}
export function Device({kind,code,laptopId}:{kind:string;code:string;laptopId?:number}){usePageIdentity(kind==='laptop'?`terminal-${laptopId??1}`:kind,kind==='laptop'?`Laptop ${laptopId}`:undefined);const [token]=useState(()=>readToken(kind,code,laptopId));if(!token)return <main className="device-unpaired"><Brand large/><Monitor size={60}/><p>Koppel dit scherm via Apparaten & QR in het admin-dashboard.</p></main>;return <ConnectedDevice kind={kind} code={code} token={token} laptopId={laptopId}/>;}
function ConnectedDevice({kind,code,token,laptopId}:{kind:string;code:string;token:string;laptopId?:number}){const {state:s,connected,error,offset,action}=useGame(code,token),[busy,setBusy]=useState(false),[failed,setFailed]=useState(false),[confirmed,setConfirmed]=useState(false);const now=useServerNow(offset,s?.pausedAt);if(!s)return <main className="device-unpaired"><Brand/>{error?<p>{error}</p>:<span className="loader"/>}</main>;
  // A device token cannot be reused to obtain another interface's capabilities.
  if(s.device!==kind||(kind==='laptop'&&s.laptopId!==laptopId))return <main className="device-unpaired"><Monitor size={60}/><p>Deze koppeling hoort bij een ander apparaat.</p></main>;
  if(kind==='emergency'){const cooldown=s.cooldownUntil && s.cooldownUntil>now;const usable=connected&&!busy&&s.phase==='playing'&&s.meeting.phase==='idle'&&!cooldown;return <main className={`emergency-screen ${usable?'ready':''}`}><Brand/><div className="emergency-center">{s.meeting.phase!=='idle'?<Ring deadline={s.meeting.deadline} duration={s.meeting.phase==='gathering'?s.durations.gather:s.durations.discuss} now={now} color="red" icon={UsersRound} size={300}/>:cooldown?<Ring deadline={s.cooldownUntil} duration={s.durations.cooldown} now={now} color="red" icon={Hourglass} size={300}/>:<button className="emergency-button" aria-label="Emergency meeting oproepen" disabled={!usable} onClick={async()=>{setBusy(true);try{await action('request-meeting');setFailed(false);}catch{setFailed(true);}finally{setBusy(false);}}}><BellRing size={105}/><span>{busy?'OPROEPEN…':'MEETING'}</span></button>}<div className="emergency-line"><span/>{failed?<Hourglass size={29}/>:<UsersRound size={32}/>}<span/></div></div><span className={`live-dot ${connected?'online':''}`}/>{s.phase==='paused'&&<div className="paused-overlay"><PauseGlyph/></div>}</main>;}
  if(kind==='board'&&s.phase==='lobby')return <main className="board-screen"><header><Brand large/><span className={`live-dot ${connected?'online':''}`}/></header><BoardLobby s={s}/></main>;
  if(kind==='board'&&s.phase==='briefing')return <main className="board-screen"><Brand large/><Briefing s={s} action={action} disabled={!connected}/></main>;
  if(kind==='board')return <main className={`board-screen ${s.meeting.phase!=='idle'?'in-meeting':''}`}><header><Brand large/><span className={`live-dot ${connected?'online':''}`}/></header>{s.phase==='ended'?<><EndScene s={s}/><ResultSummary s={s}/></>:<><div className="board-cash"><MoneyStatus company={s.company}/><MoneyBar large progress={s.companyProgress} red={s.reservedProgress}/></div>{s.meeting.phase==='idle'?<div className="board-round"><Ring deadline={s.nextMeetingAt} duration={s.durations.auto} now={now} size={330} color="brown" icon={s.phase==='lobby'?Hourglass:BellRing}/><div className="board-phase"><UsersRound size={48}/><span/><BriefcaseGlyph/></div></div>:<MeetingOverlay s={s} now={now}/>}{s.lastDismissal&&<div className="public-dismissal"><Avatar name={s.lastDismissal.name}/><h2>{s.lastDismissal.name}</h2><RoleIcon role={s.lastDismissal.role} size={58}/></div>}</>}{s.phase==='paused'&&<div className="paused-overlay"><PauseGlyph/></div>}</main>;
  const task=s.tasks.find((t:any)=>t.id===laptopId);
  return <main className={`laptop-screen ${s.terminal?'terminal-active':''}`}><header><Brand/><span className={`live-dot ${connected?'online':''}`}/></header>
    <MoneyStatus company={s.company}/><MoneyBar progress={s.companyProgress} red={s.reservedProgress}/>
    {confirmed&&<div className="game-toast" role="status">✓ Boeking verwerkt</div>}<div className="laptop-content">
      <div className="terminal-identity"><div className="code-label"><Monitor size={24}/><InfinityIcon size={23}/><span>Laptopcode</span></div><SymbolCode code={s.laptopCode}/></div>
      {!s.terminal&&s.lastTerminalFailure&&<p className="task-feedback" role="alert">{s.lastTerminalFailure.message}</p>}<div className="laptop-task-seal"><Icon name={task?.icon??'calculator'} size={80}/></div>
      {s.terminal?<FinancialTask now={now} onComplete={()=>{setConfirmed(true);setTimeout(()=>setConfirmed(false),4000);}} terminal={s.terminal} action={action} disabled={!connected||s.phase!=='playing'||s.meeting.phase!=='idle'}/>:<div className="terminal-idle" aria-label="Voer de laptopcode in op je telefoon"><Monitor size={36}/><ArrowRight size={24}/><Smartphone size={36}/></div>}
    </div>
    {s.phase==='ended'?<div className="laptop-ended"><EndScene s={s}/></div>:<MeetingOverlay s={s} now={now}/>}
    {s.phase==='paused'&&<div className="paused-overlay"><PauseGlyph/></div>}
  </main>;
}
function PauseGlyph(){return <div className="pause-symbol"><span/><span/></div>;}
function BriefcaseGlyph(){return <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="3"><rect x="7" y="14" width="34" height="26" rx="5"/><path d="M17 14V8h14v6M7 23h34M22 22v6h4v-6"/></svg>;}
