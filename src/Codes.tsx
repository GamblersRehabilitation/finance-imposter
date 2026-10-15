import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Circle, Diamond, Eraser, Hexagon, Monitor, Smartphone, Square, Star, Triangle, X } from 'lucide-react';
import { Icon } from './ui';

const shapes=[Circle,Triangle,Square,Diamond,Star,Hexagon];
const names=['Cirkel','Driehoek','Vierkant','Ruit','Ster','Zeshoek'];
export function SymbolCode({code}:{code:string}){
  return <div className="symbol-code" role="img" aria-label={code.split('').map(n=>names[Number(n)]).join(', ')}>{code.split('').map((n,i)=>{const Shape=shapes[Number(n)];return <span key={i}><Shape aria-hidden="true"/></span>;})}</div>;
}

type Action=(name:string,data?:unknown)=>Promise<any>;
/** Pair once on the phone; the financial task itself runs on the laptop. */
export function CodePopup({s,taskId,kind,action,connected,onClose}:{s:any;taskId:number|null;kind:'task'|'theft';action:Action;connected:boolean;onClose:()=>void}){
  const [value,setValue]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[done,setDone]=useState(false);
  const lock=useRef(false),dialog=useRef<HTMLDialogElement>(null),previousAttempt=useRef<string|undefined>(undefined);
  const attempt=s.terminalAttempt;
  const active=s.phase==='playing'&&s.meeting.phase==='idle'&&connected;
  const task=s.tasks.find((t:any)=>t.id===(attempt?.laptopId??taskId));
  const completed=kind==='task'&&s.myTasks.some((t:any)=>t.id===taskId&&t.completed);
  useEffect(()=>{const element=dialog.current;element?.showModal();return()=>element?.close();},[]);
  useEffect(()=>{
    setValue('');
    setDone(completed);
    setError(previousAttempt.current&&!attempt&&!lock.current&&!completed?'Poging verlopen':'');
    previousAttempt.current=attempt?.id;
  },[attempt?.id,completed]);
  async function submit(){
    if(lock.current||value.length!==4||!active)return;
    lock.current=true;setBusy(true);setError('');
    try{
      await action('terminal-begin',{kind,laptopId:taskId,code:value});
      setValue('');
    }catch(e){setError((e as Error).message);setValue('');}finally{lock.current=false;setBusy(false);}
  }
  async function close(){if(lock.current)return;lock.current=true;setBusy(true);try{if(attempt&&!done)await action('terminal-cancel');onClose();}catch(e){setError((e as Error).message);}finally{lock.current=false;setBusy(false);}}
  return <dialog ref={dialog} className="code-dialog" aria-label={done?'Geslaagd':attempt?'Telefoon gekoppeld':'Laptopcode invoeren'} onCancel={e=>{e.preventDefault();void close();}}>
    <button className="code-close" disabled={busy} onClick={close} aria-label="Sluiten"><X/></button>
    {attempt?<div className="code-success" role="status" aria-label="Telefoon gekoppeld"><Check size={78}/><div className="code-flow"><Smartphone/><ArrowRight/><Monitor/></div><button className="btn icon-only" onClick={onClose} aria-label={kind==='theft'?'Doorgaan met steelspel':'Doorgaan op de terminal'}><ArrowRight/></button></div>:done?<div className="code-success" role="status" aria-label="Geslaagd"><Check size={78}/><button className="btn icon-only" onClick={onClose} aria-label="Doorgaan"><ArrowRight/></button></div>:<>
      <div className="code-flow"><Monitor size={32}/><ArrowRight size={20}/><Smartphone size={30}/></div>
      <div className="code-task">{task?<Icon name={task.icon} size={40}/>:<Monitor size={40}/>}<span>{attempt?'Taakcode':'Laptopcode'}</span></div>
      <div className={`code-slots ${error?'invalid':''}`} aria-label={`${value.length} van 4 vormen ingevoerd`}>{Array.from({length:4},(_,i)=><div key={i}>{value[i]!==undefined?<SymbolCode code={value[i]}/>:<span/>}</div>)}</div>
      {error&&<div className="code-error" role="alert"><X size={20}/><span>{error}</span></div>}
      {!active&&<div className="code-error" role="status">{connected?'Even wachten':'Verbinding herstellen'}</div>}
      <div className="code-keypad">{shapes.map((Shape,i)=><button key={i} disabled={busy||!active||value.length===4} aria-label={names[i]} onClick={()=>{setValue(v=>v+String(i));setError('');}}><Shape size={30}/></button>)}</div>
      <div className="code-actions"><button className="btn light icon-only" disabled={busy||!value} onClick={()=>{setValue(v=>v.slice(0,-1));setError('');}} aria-label="Laatste vorm wissen"><Eraser/></button><button className="btn icon-only" disabled={busy||!active||value.length!==4} onClick={submit} aria-label={attempt?'Code bevestigen':'Laptop koppelen'}>{busy?<span className="loader"/>:<ArrowRight/>}</button></div>
    </>}
  </dialog>;
}
