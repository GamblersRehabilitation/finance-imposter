import {useState} from 'react';
import {ArrowRight,Check,Coins,FileX2,Hand,Monitor,RotateCcw,Search,ShieldCheck,X} from 'lucide-react';
import {cue} from './feedback';
import {DigitalTimestamp,ScanResult} from './SecurityPanel';
/** Safe local examples: this never calls investigate or uses a scan charge. */
export function SecurityPractice({kind}:{kind:'money'|'failure'|'clear'}){
 const [choice,setChoice]=useState<string|null>(null),correct=choice===kind,at=Date.UTC(2026,9,16,9,12,37);
 const scan={id:'practice',laptopId:3,at:at+7000,transactionTimes:kind==='money'?[at]:[],failures:kind==='failure'?[at]:[]};
 return <section className="security-practice" aria-label="Oefen de scansymbolen zonder echte scan"><div className="lesson-mode"><Hand/><ShieldCheck/><Monitor/><b>3</b></div>
  <div className="security-practice-event" aria-label="Voorbeeld van wat er op de laptop gebeurde">{kind==='money'?<><Coins/><ArrowRight/></>:kind==='failure'?<><FileX2/><X/></>:<><Search/><b>0</b></>}<DigitalTimestamp at={at}/></div>
  <div className="security-practice-choices" aria-label="Kies het bijpassende scansymbool">{([{value:'money',Icon:Coins},{value:'failure',Icon:FileX2},{value:'clear',Icon:ShieldCheck}] as const).map(({value,Icon})=><button key={value} className={`btn light ${choice===value?'selected':''}`} aria-label={value==='money'?'Geldspoor':value==='failure'?'Taakfout':'Geen sporen'} aria-pressed={choice===value} onClick={()=>{setChoice(value);cue(value===kind?'success':'error');}}><Icon/></button>)}</div>
  {choice&&(correct?<><div className="visual-success" role="status" aria-label="Juiste symbool, klik zelf verder"><Check/><ShieldCheck/></div><ScanResult scan={scan}/></>:<div className="visual-error" role="status" aria-label="Probeer het andere symbool"><X/><RotateCcw/></div>)}
 </section>;
}
