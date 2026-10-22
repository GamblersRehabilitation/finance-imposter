import {useEffect,useRef,useState} from 'react';
import {ArrowRight,Check,Coins,Smartphone,UsersRound,X,BellRing,RotateCcw,Play,CircleHelp} from 'lucide-react';
import {RoleIcon} from './ui';
import {cue,usePhoneAudio} from './feedback';
import {RoleVideo} from './RoleFilm';
export {RoleVideo} from './RoleFilm';
export function RoleHelp({role}:{role:string}){return <section className="role-help visual-role-help" aria-label="Uitleg van je rol"><RoleVideo key={role} role={role}/></section>;}
export function RoleIntro({role,disabled=false,onClose}:{role:string;disabled?:boolean;onClose:()=>void}){const dialog=useRef<HTMLDialogElement>(null);useEffect(()=>{const el=dialog.current;el?.showModal();return()=>el?.close();},[]);return <dialog ref={dialog} className="role-intro-dialog role-intro-film-dialog" aria-label="Persoonlijke roluitleg" onCancel={e=>{e.preventDefault();if(!disabled)onClose();}}><div className="role-intro-controls"><button className="btn light icon-only" aria-label="Rolintro overslaan" disabled={disabled} onClick={onClose}><X/></button></div><RoleHelp key={role} role={role}/></dialog>;}
export function RoleGuide({role}:{role:string}){const [open,setOpen]=useState(false);return <><button className="role-guide btn light" aria-label="Eigen roluitleg" onClick={()=>{setOpen(true);cue('select');}}><CircleHelp/><RoleIcon role={role} size={24}/></button>{open&&<RoleIntro role={role} onClose={()=>{setOpen(false);cue('back');}}/>}</>;}
/** Called before any screen branch so meeting alerts survive overlays, briefing and role intros. */
export function useGameFeedback(s:any){
  usePhoneAudio();
  const previous=useRef<any>(null),[message,setMessage]=useState(''),[visual,setVisual]=useState<'success'|'failure'|undefined>();
  function announce(text:string,kind?:'success'|'failure'){setMessage(text);setVisual(kind);}
  useEffect(()=>{
    if(!s)return;
    const before=previous.current;
    if(before&&before.id===s.id){
      if(before.meeting.phase!==s.meeting.phase){announce(s.meeting.phase==='idle'?'Werk hervat':'Meeting: ga naar de groep');cue(s.meeting.phase==='gathering'?'meeting':'tap');}
      else if(before.lastTaskFailure?.id!==s.lastTaskFailure?.id&&s.lastTaskFailure){announce(s.lastTaskFailure.reason==='timeout'?'Taaktijd verstreken · koppel opnieuw':'Poging mislukt · koppel opnieuw','failure');cue('error');}
      else if((before.security?.alerts.length??0)<(s.security?.alerts.length??0)){announce('Nieuw incident · bekijk je scans');cue('alert');}
      else if((before.completedTasks??0)<(s.completedTasks??0)){announce('Taak voltooid · kas bijgewerkt','success');cue('success');}
      else if(before.phase!==s.phase&&s.phase==='ended'){announce('Spel afgelopen');cue('alert');}
    }
    previous.current=s;
  },[s?.revision,s?.id,s?.phase]);
  useEffect(()=>{if(!message)return;const timer=setTimeout(()=>setMessage(''),4500);return()=>clearTimeout(timer);},[message]);
  return {message,visual};
}
export function FeedbackToast({message,visual}:{message:string;visual?:'success'|'failure'}){return message?<div className="game-toast" role="status" aria-label={message}>{visual==='failure'?<><X/><RotateCcw/><Smartphone/></>:visual==='success'?<><Check/><Coins/></>:<><BellRing/><UsersRound/></>}</div>:null;}
