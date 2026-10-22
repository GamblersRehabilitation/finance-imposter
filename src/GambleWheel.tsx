import {WheelBoard} from './WheelBoard';
import {memo,useEffect,useRef,useState} from 'react';
import {Coins,RotateCw,CircleHelp,ArrowRight,ArrowUp,ArrowDown,Check,X} from 'lucide-react';
import {WHEEL} from './wheelRules';
import {money} from './ui';
import {cue} from './feedback';
import {SkillTutorial} from './SkillTutorial';
const sector=360/WHEEL.length;

type Spin={id:string;startedAt:number;endsAt:number;stake:number;segment?:number;serverTime?:number};
export const GambleGame=memo(function GambleGame({s,action,disabled,onMotionStart,onMotionEnd}:{s:any;action:(name:string,data?:unknown)=>Promise<any>;disabled:boolean;onMotionStart?:(id:string,balance:number,wealth?:number)=>void;onMotionEnd?:()=>void}){
 const [help,setHelp]=useState(false),[stake,setStake]=useState(1000),[busy,setBusy]=useState(false),[error,setError]=useState(''),[localSpin,setLocalSpin]=useState<Spin|null>(null),[animating,setAnimating]=useState(false);
 const wheel=useRef<HTMLDivElement>(null),motion=useRef<Animation|null>(null),rotation=useRef(0),started=useRef<string|null>(null),seen=useRef(s.gambler.lastSpin?.id),lock=useRef(false),frozenBalance=useRef(s.gambler.balance);
 const pending=s.gambler.pendingSpin as Spin|null,last=s.gambler.lastSpin;
 const spin=pending??(localSpin?.id!==last?.id?localSpin:null);
 useEffect(()=>{if(pending)setLocalSpin(pending);else if(last?.id===localSpin?.id)setLocalSpin(null);},[pending?.id,last?.id]);
 useEffect(()=>{
   if(!spin||!wheel.current||started.current===spin.id)return;
   started.current=spin.id;frozenBalance.current=s.gambler.balance;setAnimating(true);if(spin.segment!==undefined)onMotionStart?.(spin.id,s.gambler.balance,s.gambler.wealth);
   motion.current?.cancel();
   const target=Math.ceil(rotation.current/360)*360+360*7+360-((spin.segment??0)*sector+sector/2),duration=spin.endsAt-spin.startedAt;
   const elapsed=Math.min(duration,Math.max(0,(spin.serverTime??s.serverTime)-spin.startedAt));
   const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
   const animation=wheel.current.animate([{transform:`rotate(${reduced?target:rotation.current}deg)`},{transform:`rotate(${target}deg)`}],{duration,easing:'cubic-bezier(0.12, 0.68, 0.12, 1)',fill:'forwards'});
   animation.currentTime=elapsed;motion.current=animation;
   animation.finished.then(()=>{rotation.current=target;setAnimating(false);onMotionEnd?.();}).catch(()=>{});
 },[spin?.id,help]);
 useEffect(()=>{if(s.phase==='paused')motion.current?.pause();else if(s.phase==='playing'&&s.meeting.phase==='idle')motion.current?.play();else{motion.current?.cancel();setAnimating(false);setLocalSpin(null);onMotionEnd?.();}},[s.phase,s.meeting.phase]);
 useEffect(()=>()=>{motion.current?.cancel();onMotionEnd?.();},[]);
 useEffect(()=>{if(!animating&&last?.id&&seen.current!==last.id){seen.current=last.id;cue(last.win?'success':'error');}},[last?.id,animating]);
 async function start(){if(lock.current)return;lock.current=true;setBusy(true);setError('');cue();try{const r=await action('gamble',{stake});if(r.spin)setLocalSpin({...r.spin,serverTime:r.serverTime});}catch(e){setError((e as Error).message);cue('error');}finally{setBusy(false);lock.current=false;}}
 async function finishLesson(){if(lock.current)return;lock.current=true;setBusy(true);try{await action('wheel-tutorial');setHelp(false);cue('back');}catch(e){setError((e as Error).message);cue('error');}finally{lock.current=false;setBusy(false);}}
 const spinning=!!spin||animating;
 return <section className="gamble-game"><header className="visual-section-header"><RotateCw size={32}/><button className="btn light icon-only" aria-label="Stille uitleg van het gokrad" disabled={spinning} onClick={()=>setHelp(true)}><CircleHelp/></button></header>{help?<SkillTutorial kind="wheel" disabled={disabled||busy} onClose={()=>{void finishLesson();}}/>:<WheelBoard gambler={s.gambler} stake={stake} onStake={setStake} onStart={start} disabled={disabled} spinning={spinning} busy={busy} balance={animating?frozenBalance.current:s.gambler.balance} rotation={rotation.current} wheelRef={wheel} last={last}/>}{error&&<div className="visual-error" role="alert" aria-label={error}><X/><Coins/></div>}</section>;
});
