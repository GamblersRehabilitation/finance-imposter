import {memo,useEffect,useRef,useState} from 'react';
import {Coins,RotateCw} from 'lucide-react';
import {WHEEL} from './wheelRules';
import {money} from './ui';
import {cue} from './feedback';
const sector=360/WHEEL.length;
const colors=WHEEL.map(s=>s.factor===0?'#b8887a':s.factor===.5?'#c6aa91':s.bonus?'#e7d9b8':s.factor===4?'#d1af58':'#869c7e');
const background=`conic-gradient(${colors.map((c,i)=>`${c} ${i*sector}deg ${(i+1)*sector}deg`).join(',')})`;
type Spin={id:string;startedAt:number;endsAt:number;stake:number;segment?:number;serverTime?:number};
export const GambleGame=memo(function GambleGame({s,action,disabled,onMotionStart,onMotionEnd}:{s:any;action:(name:string,data?:unknown)=>Promise<any>;disabled:boolean;onMotionStart?:(id:string,balance:number)=>void;onMotionEnd?:()=>void}){
 const [stake,setStake]=useState(5),[busy,setBusy]=useState(false),[error,setError]=useState(''),[localSpin,setLocalSpin]=useState<Spin|null>(null),[animating,setAnimating]=useState(false);
 const wheel=useRef<HTMLDivElement>(null),motion=useRef<Animation|null>(null),rotation=useRef(0),started=useRef<string|null>(null),seen=useRef(s.gambler.lastSpin?.id),lock=useRef(false),frozenBalance=useRef(s.gambler.balance);
 const pending=s.gambler.pendingSpin as Spin|null,last=s.gambler.lastSpin;
 const spin=pending??(localSpin?.id!==last?.id?localSpin:null);
 useEffect(()=>{if(pending)setLocalSpin(pending);else if(last?.id===localSpin?.id)setLocalSpin(null);},[pending?.id,last?.id]);
 useEffect(()=>{
   if(!spin||!wheel.current||started.current===spin.id)return;
   started.current=spin.id;frozenBalance.current=s.gambler.balance;setAnimating(true);if(spin.segment!==undefined)onMotionStart?.(spin.id,s.gambler.balance);
   motion.current?.cancel();
   const target=Math.ceil(rotation.current/360)*360+360*7+360-((spin.segment??0)*sector+sector/2),duration=spin.endsAt-spin.startedAt;
   const elapsed=Math.min(duration,Math.max(0,(spin.serverTime??s.serverTime)-spin.startedAt));
   const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
   const animation=wheel.current.animate([{transform:`rotate(${reduced?target:rotation.current}deg)`},{transform:`rotate(${target}deg)`}],{duration,easing:'cubic-bezier(0.12, 0.68, 0.12, 1)',fill:'forwards'});
   animation.currentTime=elapsed;motion.current=animation;
   animation.finished.then(()=>{rotation.current=target;setAnimating(false);onMotionEnd?.();}).catch(()=>{});
 },[spin?.id]);
 useEffect(()=>{if(s.phase==='paused')motion.current?.pause();else if(s.phase==='playing'&&s.meeting.phase==='idle')motion.current?.play();else{motion.current?.cancel();setAnimating(false);setLocalSpin(null);onMotionEnd?.();}},[s.phase,s.meeting.phase]);
 useEffect(()=>()=>{motion.current?.cancel();onMotionEnd?.();},[]);
 useEffect(()=>{if(!animating&&last?.id&&seen.current!==last.id){seen.current=last.id;cue(last.win?'success':'error');}},[last?.id,animating]);
 async function start(){if(lock.current)return;lock.current=true;setBusy(true);setError('');cue();try{const r=await action('gamble',{stake});if(r.spin)setLocalSpin({...r.spin,serverTime:r.serverTime});}catch(e){setError((e as Error).message);cue('error');}finally{setBusy(false);lock.current=false;}}
 const spinning=!!spin||animating;
 return <section className="gamble-game"><h2>Het buitrad</h2><p className="play-help">Meer risico: 10 van de 16 vakken kosten buit. Kies je inzet; het saldo volgt na de draai.</p><div className="real-wheel-wrap"><span className="wheel-pointer" aria-hidden="true">▼</span><div ref={wheel} className="real-wheel smooth-wheel" style={{background,transform:`rotate(${rotation.current}deg)`}}>{WHEEL.map((v,i)=><span key={i} className="wheel-sector-label" style={{transform:`rotate(${i*sector+sector/2}deg)`}}><b>{v.label}</b></span>)}<div className="wheel-hub"><Coins/></div></div></div><div className="loot" aria-label="Gedeelde buit"><Coins/>{money(animating?frozenBalance.current:s.gambler.balance)}</div><label>Inzet<input type="number" min="1" max={Math.min(12500,s.gambler.balance)} value={stake} disabled={spinning||busy} onChange={e=>setStake(Number(e.target.value))}/></label><button className="btn" disabled={disabled||busy||spinning||!Number.isInteger(stake)||stake<1||stake>s.gambler.balance||stake>12500} onClick={start}><RotateCw/>{spinning?'Rad draait…':busy?'Inzet vastleggen…':'Draai het rad'}</button><p role="status" className="wheel-result">{spinning?(spin?.segment===undefined?'Je partner draait het gedeelde rad.':animating?'Spanning…':'Resultaat verwerken…'):last?`${last.payout-last.stake>=0?'+':'−'}${money(Math.abs(last.payout-last.stake))} buit`:'×2 · ×4 jackpot'}</p><details className="wheel-rules"><summary>Wat betekenen de vakken?</summary><p>16 gelijke kansen: ×0: 8 vakken met hele inzet kwijt; ½: 2 vakken met halve inzet terug, 2× €1 winst, 3× dubbele uitbetaling en 1× vierdubbele uitbetaling. Uitbetalingen bevatten je inzet; halve bedragen ronden naar beneden af.</p><p>De draai loopt op je telefoon. De server legt de inzet en uitkomst vast en betaalt pas na de vijf seconden. Een meeting of speleinde annuleert een onafgeronde draai.</p></details>{error&&<p role="alert">{error}</p>}</section>;
});
