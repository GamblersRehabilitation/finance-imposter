import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, LoaderCircle, UsersRound, X, FileCheck2, Coffee, Leaf, Monitor, Armchair, Truck, Hourglass } from 'lucide-react';
import {ClientProgress} from './ClientProgress';
import { cue } from './feedback';
const titles=['Koffie-architect','Muis-beweger','Bureauplantverzorger','Vergaderstoeltester','Excel-assistent','Kantoorkoerier','Papiermanager','Junior koffietester'];
const companies=['Bureau Morgen','Uitstel & Partners','Nieuwe Koers','Stil Werk B.V.'];
export function InfiniteJobs({s,action,disabled,now}:{s:any;action:(name:string,data?:any)=>Promise<any>;disabled:boolean;now:number}){
  const sentinel=useRef<HTMLDivElement>(null),last=useRef<Record<string,string>>({});
  const [count,setCount]=useState(8),[sending,setSending]=useState<number|null>(null),[error,setError]=useState('');
  const pending=s.jobs.some((j:any)=>['checking','provisional'].includes(j.stage));
  useEffect(()=>{const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))setCount(n=>Math.min(4096,n+8));},{rootMargin:'100px'});if(sentinel.current)observer.observe(sentinel.current);return()=>observer.disconnect();},[count]);
  useEffect(()=>{for(const j of s.jobs){if(last.current[j.id]&&last.current[j.id]!==j.stage)cue(j.stage==='rejected'?'error':j.stage==='accepted'||j.stage==='provisional'?'success':'tap');last.current[j.id]=j.stage;}},[s.jobs]);
  async function apply(jobId:number){setSending(jobId);setError('');try{await action('apply-job',{jobId});cue('tap');}catch(e){setError((e as Error).message);}finally{setSending(null);}}
  return <section className="job-search"><div className="job-heading"><UsersRound/><h2>Vacatures</h2></div>{error&&<div className="visual-error" role="alert"><X/>Sollicitatie mislukt</div>}<div className="vacancy-feed">{Array.from({length:count},(_,i)=>{const job=s.jobs.find((j:any)=>j.jobId===i),stage=job?.stage,active=['checking','provisional'].includes(stage),loading=sending===i;return <button key={i} className={`vacancy ${stage??''}`} disabled={disabled||sending!==null||pending||!!job} onClick={()=>apply(i)}><h3><JobGlyph index={i}/><span>{titles[i%titles.length]}</span></h3><p>{companies[i%companies.length]} · #{i+1}</p><p>€ {(2400+(i%8)*150).toLocaleString('nl-NL')} / maand · {i%2?32:24} uur</p>{loading?<span role="status"><LoaderCircle className="spin"/>Sollicitatie versturen…</span>:job?<div role="status">{active?<><span>{stage==='provisional'?<Check/>:<LoaderCircle className="spin"/>}{stage==='provisional'?'Aangenomen!':'Geschiktheid controleren…'}</span><ClientProgress start={job.startedAt} end={job.finishedAt} now={now} paused={s.phase==='paused'} label="Sollicitatiecontrole"/></>:<><span><X/>Afgewezen</span><span className="vacancy-reason">{job.reason}</span></>}</div>:<span><FileCheck2/>Solliciteren<ArrowRight size={16}/></span>}</button>;})}</div><div ref={sentinel} aria-hidden="true"/>{count<4096&&<button className="btn light full" onClick={()=>setCount(n=>Math.min(4096,n+8))}>Meer vacatures<ArrowRight/></button>}</section>;
}

function SearchGlyph(){return <FileCheck2 size={42}/>;}
function JobGlyph({index}:{index:number}){const Icon=[Coffee,Monitor,Leaf,Armchair,FileCheck2,Truck][index%6];return <Icon size={48}/>;}
