import {ArrowRight,BellRing,Check,Coins,FileX2,LoaderCircle,Monitor,Search,ShieldCheck,X} from 'lucide-react';
import {scanEvents,scanOutcome,timestamp,type ScanEntry} from './securityRules';
export function DigitalTimestamp({at}:{at:number}){return <time dateTime={new Date(at).toISOString()}>{timestamp(at)}</time>;}
export function ScanResult({scan}:{scan:ScanEntry}){
 const outcome=scanOutcome(scan),events=scanEvents(scan);
 return <section className={`scan-result scan-${outcome}`} aria-label={outcome==='money'?'Geldspoor gevonden':outcome==='failure'?'Taakfout gevonden, geen geldspoor':'Geen sporen gevonden op deze laptop'}>
  <div className="scan-complete" aria-label="Scan uitgevoerd"><Search/><Check/><Monitor/><b>{scan.laptopId}</b></div>
  <div className="scan-outcome">{outcome==='money'?<><Coins/><ArrowRight/></>:outcome==='failure'?<><FileX2/><X/></>:<><ShieldCheck/><Check/></>}</div>
  {events.length?<div className="scan-events">{events.map((event,i)=><div className={`scan-event ${event.kind}`} key={`${event.kind}-${event.at}-${i}`} aria-label={event.kind==='money'?'Tijdstip van geldspoor':'Tijdstip van taakfout'}>{event.kind==='money'?<Coins/>:<FileX2/>}<DigitalTimestamp at={event.at}/></div>)}</div>:<div className="scan-events"><Search/><span>0</span></div>}
  <div className="scan-recorded" aria-label="Scan uitgevoerd om"><Search/><DigitalTimestamp at={scan.at}/></div>
 </section>;
}

export function ScanQuota({quota,max=2}:{quota:number;max?:number}){return <div className="scan-quota" aria-label={`${quota} scans over tot de volgende meeting`}>{Array.from({length:max},(_,i)=><span key={i} className={i<quota?'available':'used'}><Search/>{i<quota?<Check/>:<X/>}</span>)}</div>;}
export function SecurityAlerts({alerts,disabled=false,pending=null,onScan}:{alerts:{laptopId:number}[];disabled?:boolean;pending?:number|null;onScan:(id:number)=>void}){return <div className="security-alerts" role="log" aria-live="polite">{!alerts.length?<div className="visual-empty" aria-label="Nog geen meldingen"><BellRing/><span>0</span></div>:Array.from(new Set<number>(alerts.map(a=>a.laptopId))).map(laptopId=><div key={laptopId} aria-label={`Verdacht verkeer bij laptop ${laptopId}; oorzaak nog onbekend`}><BellRing/><Monitor/><b>{laptopId}</b><span>?</span><button className="btn light icon-only" aria-label={`Scan laptop ${laptopId}`} disabled={disabled} onClick={()=>onScan(laptopId)}>{pending===laptopId?<LoaderCircle className="spin"/>:<Search/>}</button></div>)}</div>;}
