import {useEffect,useRef,useState} from 'react';
import {ArrowRight,Check,Coins,Monitor,ShieldCheck,Smartphone,UsersRound} from 'lucide-react';
import {RoleIcon} from './ui';
import {cue,usePhoneAudio} from './feedback';
const guides:Record<string,{title:string;goal:string;steps:string[]}>={
  employee:{title:'Werknemer',goal:'Werk samen: vul de bedrijfskas tot €100 of ontmasker alle Gokkers.',steps:['Kies een taak op je telefoon.','Ga naar die laptop en voer de vier symbolen in op je telefoon.','Doe drie onderdelen op de laptop: bereken, controleer en koppel. Je hebt 30 seconden per onderdeel; daarna vult de beloning de kas.']},
  gambler:{title:'Gokker · houd dit geheim',goal:'Laat jullie gedeelde buit het doel bereiken. Je partner zie je lager op deze pagina.',steps:['Doe gewone taken om vertrouwen te winnen en de kas te vullen.','Vanaf €25 in de kas: scroll naar Stelen en koppel een kaslaptop met de symbolen.','Je krijgt willekeurig een slot of leidingpuzzel. Stop vier pinnen in goud of verbind IN met UIT. Daarna kun je innen of meer riskeren.','Scroll naar het Rad om de gedeelde buit te vergroten. Je kunt je inzet verliezen.']},
  security:{title:'Beveiliger',goal:'Verzamel aanwijzingen en deel ze tijdens het overleg.',steps:['Voltooi ook je eigen financiële taak.','Bij een taakfout of gestolen geld verschijnt een laptopmelding.','Scan een laptop: twee scans per ronde. Vergelijk tijdstippen met wat je zag. Een melding bewijst geen schuld.']},
  manager:{title:'Manager',goal:'Leid het overleg en bepaal wie toegang tot het bedrijf houdt.',steps:['Verzamel iedereen wanneer een meeting begint.','Start het overleg op je telefoon. Andere telefoons en laptops zijn geblokkeerd.','Ga naar Kies ontslag en selecteer maximaal één speler, of kies Niemand ontslaan.','Hervat het werk. Ook jij hebt eigen financiële taken.']},
};
export function RoleHelp({role}:{role:string}){const g=guides[role];if(!g)return null;return <section className="role-help"><div className="role-video-row"><div><RoleIcon role={role} size={46}/><h3>{g.title}</h3></div><video key={role} aria-label={`Stille uitleg van ${g.title}, 10 seconden`} src={`/roles/${role}.mp4`} autoPlay muted playsInline controls loop preload="metadata"/></div><p>{g.goal}</p><div className="role-flow"><Smartphone/><ArrowRight/><Monitor/><ArrowRight/>{role==='manager'?<UsersRound/>:role==='security'?<ShieldCheck/>:<Coins/>}</div><ol>{g.steps.map(step=><li key={step}>{step}</li>)}</ol></section>;}
/** Called before any screen branch so meeting alerts survive overlays, briefing and role intros. */
export function useGameFeedback(s:any){
  usePhoneAudio();
  const previous=useRef<any>(null),[message,setMessage]=useState('');
  useEffect(()=>{
    if(!s)return;
    const before=previous.current;
    if(before&&before.id===s.id){
      if(before.meeting.phase!==s.meeting.phase){setMessage(s.meeting.phase==='idle'?'Werk hervat':'Meeting: ga naar de groep');cue('alert');}
      else if(before.lastTaskFailure?.id!==s.lastTaskFailure?.id&&s.lastTaskFailure){setMessage(s.lastTaskFailure.reason==='timeout'?'Taaktijd verstreken · koppel opnieuw':'Poging mislukt · koppel opnieuw');cue('error');}
      else if((before.security?.alerts.length??0)<(s.security?.alerts.length??0)){setMessage('Nieuw incident · bekijk je scans');cue('alert');}
      else if(before.myTasks.filter((t:any)=>t.completed).length<s.myTasks.filter((t:any)=>t.completed).length){setMessage('Taak voltooid · kas bijgewerkt');cue('success');}
      else if(before.phase!==s.phase&&s.phase==='ended'){setMessage('Spel afgelopen');cue('alert');}
    }
    previous.current=s;
  },[s?.revision,s?.id,s?.phase]);
  useEffect(()=>{if(!message)return;const timer=setTimeout(()=>setMessage(''),4500);return()=>clearTimeout(timer);},[message]);
  return message;
}
export function FeedbackToast({message}:{message:string}){return message?<div className="game-toast" role="status"><Check size={18}/>{message}</div>:null;}
