import {useEffect,useRef,useState} from 'react';
import {ArrowRight,Check,CircleHelp,Eraser,Hand,Hourglass,Link,Monitor,Smartphone,WifiOff,X,UserRound,LockKeyhole,RotateCcw} from 'lucide-react';
import {cue} from './feedback';
import {ApiError} from './api';
import {Icon} from './ui';
import {PairingLesson,ShapeGlyph,ShapeKeys,ShapeRow,shapeNames,VisualParts} from './VisualLearning';

export function SymbolCode({code}:{code:string}){return <div className="symbol-code" role="img" aria-label={code.split('').map(n=>shapeNames[Number(n)]).join(', ')}>{code.split('').map((n,i)=><span key={i}><ShapeGlyph digit={n}/></span>)}</div>;}
type Action=(name:string,data?:any)=>Promise<any>;
/** Only accessibility labels contain instructions; practice cannot open a real terminal. */
export function CodePopup({s,taskId,kind,action,connected,onClose}:{s:any;taskId:number|null;kind:'task'|'theft';action:Action;connected:boolean;onClose:()=>void}){
 const [value,setValue]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(false),[done,setDone]=useState(false),[lesson,setLesson]=useState(!s.me.visualPractice?.pairing),[problem,setProblem]=useState('');
 const lock=useRef(false),dialog=useRef<HTMLDialogElement>(null),previousAttempt=useRef<string|undefined>(undefined);
 const attempt=s.terminalAttempt,active=s.phase==='playing'&&s.meeting.phase==='idle'&&connected,task=s.tasks.find((t:any)=>t.id===(attempt?.laptopId??taskId));
 const completed=kind==='task'&&!s.myTasks.some((t:any)=>t.id===taskId)&&s.lastTaskCompletion?.laptopId===taskId;
 useEffect(()=>{const element=dialog.current;element?.showModal();return()=>element?.close();},[]);
 useEffect(()=>{setValue('');setDone(completed);setError(!!previousAttempt.current&&!attempt&&!lock.current&&!completed);previousAttempt.current=attempt?.id;},[attempt?.id,completed]);
 async function submit(){if(lock.current||value.length!==4||!active)return;lock.current=true;setBusy(true);setError(false);try{await action('terminal-begin',{kind,laptopId:taskId,code:value,visual:true});setValue('');cue('tap');}catch(e){setError(true);setProblem(e instanceof ApiError?e.code:'CONNECTION');setValue('');cue('error');}finally{lock.current=false;setBusy(false);}}
 async function close(){if(lock.current)return;lock.current=true;setBusy(true);try{if(attempt&&!done)await action('terminal-cancel');onClose();}catch{setError(true);}finally{lock.current=false;setBusy(false);}}
 return <dialog ref={dialog} className="code-dialog visual-code-dialog" data-visual="pairing" aria-label={done?'Geslaagd':attempt?'Telefoon gekoppeld':'Laptopcode invoeren'} onCancel={e=>{e.preventDefault();void close();}}>
 {(!lesson||attempt||done)&&<button className="code-close" disabled={busy} onClick={close} aria-label="Sluiten"><X/></button>}
 {attempt?<div className="code-success" role="status" aria-label="Telefoon gekoppeld">{kind==='task'?<div className="paired-laptop-scene"><div className="paired-phone"><Smartphone size={50}/><Check size={25}/></div><ArrowRight/><div className="paired-monitor"><Monitor size={150}/><b>{attempt.laptopId}</b><span>{s.me.name}</span><Hand className="paired-point"/></div></div>:<div className="paired-theft-scene"><Monitor size={45}/><ArrowRight/><Smartphone size={90}/><Check/><Hand size={35}/></div>}{kind==='task'&&<VisualParts sequence={attempt.sequence} stage={attempt.stage??0} gameId={Number(task?.module?.replace('finance-',''))||1}/>}<button className="btn icon-only" onClick={onClose} aria-label={kind==='theft'?'Doorgaan met steelspel':'Doorgaan op de laptop'}>{kind==='task'?<Monitor/>:<Smartphone/>}<ArrowRight/></button></div>:done?<div className="code-success" role="status" aria-label="Geslaagd"><Check size={78}/><button className="btn icon-only" onClick={onClose} aria-label="Doorgaan"><ArrowRight/></button></div>:lesson?<PairingLesson disabled={!active} onSkip={async()=>{await action('pairing-practice',{code:'0241'});setLesson(false);}} onComplete={async()=>{await action('pairing-practice',{code:'0241'});setLesson(false);setValue('');}}/>:<>
 <div className="code-flow"><Monitor size={32}/><ArrowRight size={20}/><Smartphone size={30}/></div><div className="code-task">{task?<Icon name={task.icon} size={40}/>:<Monitor size={40}/>}<b>{taskId??''}</b><button className="btn light icon-only" aria-label="Stille uitleg en oefening herhalen" onClick={()=>{setLesson(true);setValue('');}}><CircleHelp/></button></div>
 <ShapeRow value={value}/>{error&&<div className="visual-error" role="alert" aria-label="Koppelen mislukt, controleer de laptop en probeer opnieuw">{problem==='TERMINAL_BUSY'?<><Hourglass/><Monitor/><UserRound/></>:problem==='CONNECTION'?<><WifiOff/><RotateCcw/></>:problem==='NOT_ASSIGNED'?<><LockKeyhole/><Monitor/></>:<><X/><Monitor/><ArrowRight/><Smartphone/></>}</div>}{!active&&<div className="visual-error" role="status" aria-label={connected?'Even wachten':'Verbinding herstellen'}>{connected?<Hourglass/>:<WifiOff/>}</div>}
 <ShapeKeys disabled={busy||!active||value.length===4} onPress={digit=>{setValue(v=>v+digit);setError(false);cue('tap');}}/>
 <div className="code-actions"><button className="btn light icon-only" disabled={busy||!value} onClick={()=>{setValue(v=>v.slice(0,-1));setError(false);}} aria-label="Laatste vorm wissen"><Eraser/></button><button className="btn icon-only" disabled={busy||!active||value.length!==4} onClick={submit} aria-label="Laptop koppelen">{busy?<span className="loader"/>:<ArrowRight/>}</button></div>
 </>}
 </dialog>;
}
