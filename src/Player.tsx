import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { ArrowLeft, ArrowRight, BellRing, BriefcaseBusiness, Check, Coins, DoorClosed, Eye, FileCheck2, Fingerprint, Hourglass, LockKeyhole, MapPin, Search, ShieldCheck, Spade, UsersRound, X } from 'lucide-react';

import {usePageIdentity} from './pageIdentity';
import {presentWheelResult} from './wheelPresentation';
import { SoundToggle } from './feedback';

import { RoleHelp,useGameFeedback,FeedbackToast } from './RoleHelp';

import { api, useGame, useServerNow } from './api';

import { CodePopup } from './Codes';

import { TheftGame, GambleGame, Briefing, ResultSummary, InfiniteJobs } from './GameWidgets';

import { Alert, AnalogClock, Avatar, Brand, FloorMap, Icon, MeetingOverlay, MoneyBar, MoneyStatus, money, Ring, RoleIcon, roleNames } from './ui';

function playerStorage(){return new URLSearchParams(location.search).get('demo')==='1'?sessionStorage:localStorage;}

function playerToken(code:string){const query=new URLSearchParams(location.search),restore=query.get('restore'),demo=query.get('demo')==='1';if(restore){playerStorage().setItem(`fi-player-${code}`,restore);history.replaceState({},'',location.pathname+(demo?'?demo=1':''));}return playerStorage().getItem(`fi-player-${code}`);}

export function PlayerApp({code}:{code:string}){const [token,setToken]=useState(()=>playerToken(code));if(!token)return <Onboarding code={code} onJoin={t=>{playerStorage().setItem(`fi-player-${code}`,t);setToken(t);}}/>;return <PlayerScreen code={code} token={token} reset={()=>{playerStorage().removeItem(`fi-player-${code}`);setToken(null);}}/>;}

function Onboarding({code,onJoin}:{code:string;onJoin:(token:string)=>void}){usePageIdentity('phone','Doe mee');const [data,setData]=useState<any>(null),[name,setName]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);useEffect(()=>{api(`/join/${code}`).then(setData).catch(e=>setError(e.message));},[code]);async function join(body:unknown){setBusy(true);try{const r=await api(`/join/${code}`,body);onJoin(r.token);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}return <main className="join-page"><Brand large/><div className="join-art"><BriefcaseBusiness size={72}/><span><Fingerprint size={30}/></span></div><h1>Welkom bij de vestiging.</h1><p>Kies je naam of registreer je hieronder.<br/>Je geheime rol verschijnt alleen op jouw telefoon.</p>{error&&<Alert>{error}</Alert>}{data&&(data.registrationOpen||data.players.length>0)?<><div className="join-names">{data.players.map((p:any)=><button disabled={busy} key={p.id} onClick={()=>join({playerId:p.id})}><Avatar name={p.name} small/>{p.name}<ArrowRight size={16}/></button>)}</div>{data.registrationOpen&&<form onSubmit={(e:FormEvent)=>{e.preventDefault();join({name});}}><label>Jouw naam<input autoComplete="given-name" maxLength={24} value={name} onChange={e=>setName(e.target.value)} placeholder="Voornaam" required/></label><button className="btn full" disabled={busy}>Doe mee <ArrowRight size={18}/></button></form>}</>:data&&<div className="join-closed"><Hourglass size={36}/><p>Er zijn geen vrije namen beschikbaar. Gebruik je bestaande koppeling of vraag de organisator om een persoonlijke herstellink.</p></div>}<small>Gamblers Addiction · Houd je rol geheim.</small></main>;}

function PlayerScreen({code,token,reset}:{code:string;token:string;reset:()=>void}){
  const {state:rawState,connected,error,offset,action}=useGame(code,token);
  const [wheelGate,setWheelGate]=useState<{id:string;balance:number}|null>(null);
  const onWheelStart=useCallback((id:string,balance:number)=>setWheelGate({id,balance}),[]),onWheelEnd=useCallback(()=>setWheelGate(null),[]);
  const s=presentWheelResult(rawState,wheelGate);
  usePageIdentity(s?.me?.role??'phone');
  const [popup,setPopup]=useState<{taskId:number|null;kind:'task'|'theft'}|null>(null);
  const [jobs,setJobs]=useState(false),[notice,setNotice]=useState(''),[selected,setSelected]=useState<string|null>(null),[busy,setBusy]=useState(false);
  const now=useServerNow(offset,s?.pausedAt),message=useGameFeedback(s);
  useEffect(()=>{if(s?.phase==='lobby'){setJobs(false);setPopup(null);}setSelected(null);if(s?.meeting.phase!=='idle')setPopup(null);},[s?.round,s?.meeting.phase,s?.phase]);
  async function act(name:string,data:unknown={}){setBusy(true);try{const result=await action(name,data);setNotice('');return result;}catch(e){setNotice((e as Error).message);}finally{setBusy(false);}}
  if(!s)return <main className="mobile-shell mobile-loading"><Brand/>{error?<><Alert>{error}</Alert><button className="btn light" onClick={reset}>Koppeling herstellen</button></>:<span className="loader"/>}</main>;
  const spectator=s.me.dismissed,role=s.me.role,meeting=s.meeting.phase!=='idle';
  const manager=role==='manager'&&!spectator,security=role==='security'&&!spectator,gambler=role==='gambler'&&!spectator;
  const disabled=!connected||s.phase!=='playing'||meeting;
  return <main className={`mobile-shell phone-scroll ${spectator?'spectator-shell':''}`}>
    <FeedbackToast message={message}/>
    <header className="mobile-top"><Brand/><SoundToggle/><span className={`live-dot ${connected?'online':''}`} aria-label={connected?'Verbonden':'Verbinding herstellen'}/></header>
    <MoneyBar progress={s.companyProgress} red={s.reservedProgress}/><MoneyStatus company={s.company}/>
    <div className="mobile-profile"><Avatar name={s.me.name}/><div><h1>{s.me.name}</h1>{spectator&&<DoorClosed size={19}/>}</div><span className={`role-badge ${spectator?'spectator':role??'employee'}`} aria-label={spectator?'Ontslagen':role?roleNames[role]:'Persoonlijk profiel'}>{spectator?<DoorClosed size={27}/>:<RoleIcon role={role} size={29}/>}</span></div>
    {notice&&<Alert>{notice}</Alert>}
    {s.phase==='ended'?<><EndScene s={s}/><ResultSummary s={s}/></>:
      s.phase==='briefing'?<Briefing s={s}/>:
      !role?<section className="phone-panel lobby-wait"><Hourglass size={42}/><h2>Even wachten</h2><p>De organisator laat je toe en deelt de rollen uit.</p></section>:
      meeting&&!manager?<section className="phone-meeting"><MeetingOverlay s={s} now={now}/></section>:
      !s.me.introSeen&&!spectator&&!meeting?<section className="phone-panel"><RoleHelp role={role}/><button className="btn full" disabled={busy} onClick={()=>act('intro')}>Ik ben klaar <ArrowRight/></button></section>:
      spectator?<section className="phone-panel">{jobs?<><button className="btn light" onClick={()=>setJobs(false)}><ArrowLeft/> Terug</button><InfiniteJobs s={s} action={action} disabled={disabled} now={now}/></>:<><div className="dismissed-illustration"><BriefcaseBusiness size={64}/><X size={32}/></div><h2>Je bent ontslagen.</h2><p>Je toegang tot het bedrijf is ingetrokken. Tijd om opnieuw werk te zoeken.</p><button className="btn" onClick={()=>setJobs(true)}><Search/> Nieuw werk zoeken</button></>}</section>:
      <>
        <details className="role-guide"><summary>Mijn rol · wat moet ik doen?</summary><RoleHelp role={role}/></details>
        {manager&&meeting&&<section className="phone-panel manager-meeting">
          <div className="meeting-instructions"><h3>{s.meeting.phase==='gathering'?'Iedereen verzamelen':s.meeting.phase==='discussion'?'Overleg':'Ontslag kiezen'}</h3><p>{s.meeting.phase==='gathering'?'Wacht tot iedereen bij elkaar staat.':s.meeting.phase==='discussion'?'Bespreek je aanwijzingen. Jij beslist wanneer het overleg klaar is.':s.meeting.dismissedId?'Ontslag verwerkt. Hervat het werk.':'Kies één speler of hervat zonder ontslag.'}</p></div>
          <Ring size={118} now={now} deadline={s.meeting.deadline} duration={s.meeting.phase==='gathering'?s.durations.gather:s.durations.discuss} color="red" icon={s.meeting.phase==='gathering'?UsersRound:BellRing}/>
          <div className="manager-actions">{s.meeting.phase==='gathering'?<button className="btn red" disabled={busy||s.phase!=='playing'} onClick={()=>act('discuss')}><UsersRound/> Start overleg</button>:s.meeting.phase==='discussion'?<button className="btn" disabled={busy||s.phase!=='playing'} onClick={()=>act('dismissal')}><DoorClosed/> Kies ontslag</button>:<button className="btn" disabled={busy||s.phase!=='playing'} onClick={()=>act('end-meeting')}><Check/> Hervat werk</button>}
            {['discussion','dismissal'].includes(s.meeting.phase)&&!s.meeting.dismissedId&&<button className="btn light" disabled={busy||s.phase!=='playing'} onClick={()=>act('dismiss-nobody')}>Niemand ontslaan · hervatten</button>}
          </div>
        </section>}
        {manager&&s.meeting.phase==='dismissal'&&<section className="phone-panel roster"><h3><UsersRound/> Speler kiezen</h3>{s.players.map((p:any)=><button key={p.id} className={`${p.dismissed?'dismissed':''} ${selected===p.id?'selected':''}`} disabled={busy||!connected||p.id===s.me.id||p.dismissed||!!s.meeting.dismissedId||s.phase!=='playing'} onClick={()=>setSelected(p.id)}><Avatar small name={p.name}/><span>{p.name}</span>{p.publicRole&&<RoleIcon role={p.publicRole} size={18}/>}</button>)}
          {selected&&!s.meeting.dismissedId&&<div className="dismiss-confirm"><span>{s.players.find((p:any)=>p.id===selected)?.name}</span><button className="btn red" disabled={busy} onClick={async()=>{const r=await act('dismiss',{playerId:selected});if(r?.ok)setSelected(null);}}><DoorClosed/> Ontsla speler</button><button className="btn light icon-only" onClick={()=>setSelected(null)} aria-label="Ontslag annuleren"><X/></button></div>}
        </section>}
        {!meeting&&<>
          <section className="mobile-section phone-panel phone-tasks"><h3><FileCheck2/> Mijn taken <span className="task-count">{s.myTasks.filter((t:any)=>t.completed).length}/{s.myTasks.length}</span></h3>
            <div className="task-list">{s.myTasks.length===0?<p>Er staan geen taken open.</p>:s.myTasks.map((t:any)=><button className={`phone-task ${t.completed?'complete':''}`} key={t.id} disabled={t.completed||disabled} aria-label={`Opdracht ${t.id} openen`} onClick={()=>setPopup({taskId:t.id,kind:'task'})}><span><Icon name={t.icon} size={31}/></span><div className="task-symbol-line"><b>{t.label}</b><small>Laptop {t.id} · {t.completed?'Voltooid':`${t.partsDone??0}/3 onderdelen · Code invoeren`}</small></div><span className="task-status">{t.completed?<Check size={21}/>:<ArrowRight size={21}/>}</span></button>)}</div>
          </section>
          <section className="mobile-section phone-panel map-section"><h3><MapPin/> Werkvloer</h3><FloorMap tasks={s.tasks} completed={s.myTasks.filter((t:any)=>t.completed).map((t:any)=>t.id)}/></section>
          {security&&<section className="mobile-section phone-panel security-section"><h3><ShieldCheck/> Incidenten & scans</h3><p className="scan-quota">{s.security.maxChecks-s.security.checks} scans over deze ronde</p><p className="play-help">Tik een gemelde laptop of kies er een op de kaart. Vergelijk tijden met wat je zag.</p>
            <div className="security-alerts" role="log" aria-live="polite">{s.security.alerts.length===0?<p>Nog geen incidenten.</p>:s.security.alerts.map((a:any)=><div key={a.id}><BellRing size={22}/><span>Laptop {a.laptopId} · {a.kind==='task'?'Taakfout':'Geld gestolen'}</span><button className="btn light" disabled={busy||disabled||s.security.checks>=2} onClick={()=>act('investigate',{laptopId:a.laptopId})}><Search size={16}/> Scan</button></div>)}</div>
            <FloorMap tasks={s.tasks} onLaptop={s.security.checks>=2||busy||disabled?undefined:id=>{void act('investigate',{laptopId:id});}}/>
            <div className="investigations">{s.security.investigations.filter((i:any)=>i.round===s.round).map((i:any)=><div key={i.id}><b>Laptop {i.laptopId}</b>{(i.failures??[]).map((at:number)=><span key={at}>Taakfout {new Date(at).toLocaleTimeString('nl-NL')}</span>)}{i.transactionTimes.length?i.transactionTimes.map((at:number)=><AnalogClock key={at} at={at}/>):<span><Eye size={20}/> Geen diefstal gevonden</span>}</div>)}</div>
          </section>}
          {gambler&&<>
            <section className="phone-panel private-panel"><h3><Spade/> Jullie gedeelde buit</h3><div className="partner-list">{s.gambler.partners.map((p:any)=><span key={p.name}><Avatar small name={p.name}/>{p.name}{p.dismissed&&<X size={15}/>}</span>)}</div><p className="shared-loot"><Coins/> {money(s.gambler.balance)}</p><p className="play-help">Doel {money(s.gambler.goal)} · nog {money(s.gambler.remaining)}</p></section>
            <section className="phone-panel private-panel" aria-label="Stelen">{s.terminalAttempt?.kind==='theft'?<TheftGame s={s} action={action} disabled={disabled}/>:<StealScreen s={s} connected={connected} onOpen={()=>setPopup({taskId:null,kind:'theft'})}/>}</section>
            <section className="phone-panel private-panel" aria-label="Gokrad"><GambleGame s={s} action={action} disabled={disabled} onMotionStart={onWheelStart} onMotionEnd={onWheelEnd}/></section>
          </>}
        </>}
      </>
    }
    {!spectator&&s.phase!=='ended'&&!meeting&&popup&&<CodePopup s={s} taskId={popup.taskId??s.terminalAttempt?.laptopId??null} kind={popup.kind} action={action} connected={connected} onClose={()=>setPopup(null)}/>}
    {s.phase==='paused'&&<div className="paused-overlay" aria-label="Spel gepauzeerd"><PauseSymbol/></div>}
  </main>;
}


function PauseSymbol(){return <div className="pause-symbol"><span/><span/></div>;}

function StealScreen({s,connected,onOpen}:{s:any;connected:boolean;onOpen:()=>void}){const usable=connected&&s.phase==='playing'&&s.meeting.phase==='idle'&&s.gambler.unlocked&&s.gambler.configured;return <section className="steal-screen"><h2>Steel uit de kas</h2><p className="play-help">Vanaf €25 bedrijfsgeld kun je stelen. Ga naar een gemarkeerde kaslaptop, voer de vier symbolen op je telefoon in en open het slot of leid de betaling om.</p><div className="placeholder-hero"><LockKeyhole size={58}/></div><button className="steal-code-button" disabled={!usable} onClick={onOpen} aria-label="Laptopcode invoeren om te stelen"><Fingerprint size={42}/><ArrowRight size={25}/><Coins size={38}/>{!usable&&<LockKeyhole size={18}/>}</button><p className="play-help">Kaslaptops: {s.gambler.moneyLaptops.join(' · ')}. Na innen volgen kasafschrijving en Beveiliger-melding na 30 seconden.</p><FloorMap tasks={s.tasks} money={s.gambler.moneyLaptops}/></section>;}

export function EndScene({s}:{s:any}){return <div className={`end-scene ${s.winner??'draw'}`}><div className="end-orbit"><span/><span/><span/><span/><span/></div><span className="end-symbol">{s.winner==='employees'?<ShieldCheck size={108}/>:s.winner==='gamblers'?<Spade size={108}/>:<Coins size={100}/>}</span>{s.winner==='draw'?<span className="draw-sign">—</span>:<Check size={38}/>}</div>;}
