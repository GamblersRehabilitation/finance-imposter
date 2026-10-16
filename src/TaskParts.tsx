import {useState} from 'react';
import {ArrowLeftRight,ArrowRight,Calculator,Check,FileSearch} from 'lucide-react';
import {money} from './ui';
import {cue} from './feedback';

export function TaskParts({stage}:{stage:number}){
 const icons=[Calculator,FileSearch,ArrowLeftRight],labels=['Bereken','Controleer','Koppel'];
 return <ol className="task-parts" aria-label={`Onderdeel ${stage+1} van 3`}>{labels.map((label,i)=>{const Icon=icons[i];return <li key={label} className={i<stage?'finished':i===stage?'current':''} aria-current={i===stage?'step':undefined}>{i<stage?<Check size={18}/>:<Icon size={18}/>}<span>{i+1}. {label}</span></li>;})}</ol>;
}
export function DocumentReview({review,disabled,onConfirm}:{review:any;disabled:boolean;onConfirm:(answer:number)=>void}){
 const [selected,setSelected]=useState<number|null>(null);
 return <><div className="review-cards" role="group" aria-label="Kies het afwijkende dossier">{review.documents.map((doc:any,i:number)=><button key={i} className={`review-card ${selected===i?'selected':''}`} aria-pressed={selected===i} disabled={disabled} onClick={()=>{setSelected(i);cue();}}><FileSearch size={26}/><b>{doc.label}</b><span>{review.expectedLabel}<strong>{money(doc.expected)}</strong></span><span>{review.actualLabel}<strong>{money(doc.actual)}</strong></span><small>{selected===i?'Geselecteerd':'Kies de afwijking'}</small></button>)}</div><button className="btn task-submit" disabled={disabled||selected===null} onClick={()=>onConfirm(selected!)}><Check/> Controle bevestigen</button></>;
}
export function BookingMatch({matching,disabled,onConfirm}:{matching:any;disabled:boolean;onConfirm:(matches:number[])=>void}){
 const [selected,setSelected]=useState<number|null>(null),[matches,setMatches]=useState<number[]>([-1,-1,-1]);
 function pair(right:number){if(selected===null)return;setMatches(old=>old.map((v,i)=>i===selected?right:v===right?-1:v));setSelected(null);cue();}
 return <><div className="matching-labels"><b>Betalingen</b><ArrowRight size={18}/><b>Dossiers</b></div><div className="booking-match"><div>{matching.items.map((item:any,i:number)=><button key={i} disabled={disabled} className={`match-card ${selected===i?'selected':''} ${matches[i]>=0?'paired':''}`} data-pair={matches[i]>=0?i:undefined} aria-pressed={selected===i} onClick={()=>{setSelected(i);cue();}}><span className="pair-marker">{i+1}</span><span><small>{item.label}</small><b>{money(item.amount)}</b></span>{matches[i]>=0&&<Check size={17}/>}</button>)}</div><div>{matching.accounts.map((item:any,i:number)=>{const left=matches.indexOf(i);return <button key={i} disabled={disabled||selected===null} className={`match-card ${left>=0?'paired':''}`} data-pair={left>=0?left:undefined} aria-label={`${item.label}, ${money(item.amount)}${left>=0?`, gekoppeld aan betaling ${left+1}`:''}`} onClick={()=>pair(i)}><span className="pair-marker">{left>=0?left+1:'?'}</span><span><small>{item.label}</small><b>{money(item.amount)}</b></span></button>;})}</div></div><p className="matching-status" role="status">{matches.filter(n=>n>=0).length}/3 gekoppeld · {selected===null?'Kies links een betaling':'Kies rechts hetzelfde bedrag'}</p><button className="btn task-submit" disabled={disabled||matches.some(n=>n<0)} onClick={()=>onConfirm(matches)}><Check/> Boekingen bevestigen</button></>;
}
