import {DigitalTimestamp,ScanResult,ScanQuota,SecurityAlerts} from './SecurityViews';
export {DigitalTimestamp,ScanResult} from './SecurityViews';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,Check,Coins,Eraser,FileX2,Monitor,Search,ShieldCheck,Smartphone,WifiOff,X} from 'lucide-react';
import {FloorMap} from './FloorMap';
import {scanOutcome,type ScanEntry} from './securityRules';
import {ShapeKeys,ShapeRow} from './VisualLearning';
import {cue} from './feedback';
import {ApiError,uuid} from './api';

/** Enter the code seen on this laptop for every scan; the server verifies it again. */
export function ScanCodeDialog({laptopId,busy,disabled,error,onScan,onClose}:{laptopId:number;busy:boolean;disabled:boolean;error:string;onScan:(code:string)=>void;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),[value,setValue]=useState('');
 useEffect(()=>{const el=dialog.current;el?.showModal();return()=>el?.close();},[]);
 useEffect(()=>{if(error==='CODE')setValue('');},[error]);
 return <dialog ref={dialog} className="code-dialog visual-code-dialog scan-code-dialog" aria-label={`Laptop ${laptopId} koppelen en scannen`} onCancel={e=>{e.preventDefault();if(!busy)onClose();}}>
  <button className="code-close" aria-label="Scannen annuleren" disabled={busy} onClick={onClose}><X/></button>
  <div className="code-flow"><Monitor size={36}/><b>{laptopId}</b><ArrowRight/><Smartphone size={34}/><ShieldCheck/></div>
  <ShapeRow value={value}/>
  {error&&<div className="visual-error" role="alert" aria-label={error==='CODE'?'Onjuiste laptopcode, probeer opnieuw':'Scan niet gelukt, probeer opnieuw'}>{error==='CODE'?<><X/><Monitor/><b>{laptopId}</b></>:<><WifiOff/><Search/></>}</div>}
  <ShapeKeys disabled={busy||disabled||value.length===4} onPress={digit=>setValue(v=>v+digit)}/>
  <div className="code-actions"><button className="btn light icon-only" aria-label="Laatste vorm wissen" disabled={busy||!value} onClick={()=>setValue(v=>v.slice(0,-1))}><Eraser/></button><button className="btn icon-only" aria-label={`Laptop ${laptopId} koppelen en scannen`} disabled={busy||disabled||value.length!==4} onClick={()=>onScan(value)}>{busy?<span className="loader"/>:<><Check/><Search/></>}</button></div>
 </dialog>;
}

export function SecurityPanel({s,action,disabled}:{s:any;action:(name:string,data:any,id?:string)=>Promise<any>;disabled:boolean}){
 const [pending,setPending]=useState<number|null>(null),[target,setTarget]=useState<number|null>(null),[selected,setSelected]=useState<ScanEntry|null>(null),[error,setError]=useState('');
 const dialog=useRef<HTMLDialogElement>(null),lock=useRef(false),request=useRef<{laptopId:number;code:string;id:string}|null>(null);
 useEffect(()=>{const el=dialog.current;if(selected){el?.showModal();return()=>el?.close();}},[selected?.id]);
 useEffect(()=>{if(disabled){setTarget(null);setError('');request.current=null;}},[disabled]);
 const quota=s.security.maxChecks-s.security.checks,scans=s.security.investigations.filter((i:ScanEntry)=>i.round===s.round);
 function open(laptopId:number){if(lock.current||disabled||quota<=0)return;setTarget(laptopId);setError('');request.current=null;cue('select');}
 async function scan(code:string){const laptopId=target;if(laptopId===null||lock.current||disabled||(quota<=0&&request.current?.laptopId!==laptopId))return;lock.current=true;setPending(laptopId);setError('');cue('select');
  const attempt=request.current?.laptopId===laptopId&&request.current.code===code?request.current:{laptopId,code,id:uuid()};request.current=attempt;
  try{const result=await action('investigate',{laptopId,code},attempt.id);if(result.investigation){setTarget(null);setSelected(result.investigation);request.current=null;cue(scanOutcome(result.investigation)==='clear'?'confirm':'alert');}}
  catch(e){setError(e instanceof ApiError?e.code:'CONNECTION');cue('error');}finally{lock.current=false;setPending(null);}
 }
 return <section className="mobile-section phone-panel security-section"><h3 aria-label="Incidenten en scans"><ShieldCheck/><Search/><span>{quota}/{s.security.maxChecks}</span></h3>
  <ScanQuota quota={quota} max={s.security.maxChecks}/><SecurityAlerts alerts={s.security.alerts} disabled={disabled||pending!==null||quota<=0} pending={pending} onScan={open}/>
  <FloorMap plan={s.floorPlan} tasks={s.tasks} onLaptop={quota<=0||pending!==null||disabled?undefined:open}/>
  <div className="investigations">{scans.map((i:ScanEntry)=><button className={`scan-history scan-${scanOutcome(i)}`} key={i.id} aria-label={`Scanresultaat laptop ${i.laptopId} opnieuw bekijken`} onClick={()=>{setSelected(i);cue('select');}}><Monitor/><b>{i.laptopId}</b>{scanOutcome(i)==='money'?<Coins/>:scanOutcome(i)==='failure'?<FileX2/>:<ShieldCheck/>}<DigitalTimestamp at={i.at}/><ArrowRight/></button>)}</div>
  {target!==null&&<ScanCodeDialog key={target} laptopId={target} busy={pending!==null} disabled={disabled} error={error} onScan={code=>void scan(code)} onClose={()=>{setTarget(null);setError('');request.current=null;cue('back');}}/>}
  {selected&&<dialog ref={dialog} className="scan-dialog" aria-label="Scanresultaat" onCancel={e=>{e.preventDefault();setSelected(null);}}><button className="btn light icon-only scan-close" aria-label="Scanresultaat sluiten" onClick={()=>{setSelected(null);cue('back');}}><X/></button><ScanResult scan={selected}/><button className="btn full" aria-label="Scan begrepen" onClick={()=>setSelected(null)}><Check/><ArrowRight/></button></dialog>}
 </section>;
}
