import {useRef,useState} from 'react';
import {ArrowRight,Check,Eraser,Link,Monitor,RotateCcw,Smartphone,X} from 'lucide-react';
import {ShapeKeys,ShapeRow} from './VisualSymbols';
import {TutorialHeader,TutorialSteps,TutorialPicture} from './TutorialNavigation';
import {cue} from './feedback';

export function PairingLesson({disabled,onComplete,onSkip}:{disabled:boolean;onComplete:()=>Promise<void>;onSkip?:()=>Promise<void>}){
 const [demo,setDemo]=useState(true),[step,setStep]=useState(0),[value,setValue]=useState(''),[wrong,setWrong]=useState(false),[busy,setBusy]=useState(false),lock=useRef(false);
 const sample='0241',steps=7;
 function next(){if(disabled||busy)return;cue('select');if(step<steps-1)setStep(n=>n+1);else{setDemo(false);setValue('');}}
 function restart(){setDemo(true);setStep(0);setValue('');setWrong(false);cue('back');}
 async function finish(skip=false){if(lock.current||disabled)return;lock.current=true;setBusy(true);try{await (skip?onSkip??onComplete:onComplete)();cue(skip?'back':'success');}catch{setWrong(true);cue('error');}finally{lock.current=false;setBusy(false);}}
 const scene=<><div className="demo-laptop"><Monitor size={46}/><ShapeRow value={sample}/></div><ArrowRight className="lesson-down"/><Smartphone size={34}/><ShapeRow value={demo?sample.slice(0,Math.min(4,Math.max(0,step-1))):value}/><ShapeKeys disabled={disabled||demo||busy||value.length===4} highlight={demo?sample[step-1]:undefined} onPress={digit=>{setValue(v=>v+digit);setWrong(false);}}/>{demo&&step===steps-1&&<div className="demo-complete"><Link/><Check/></div>}</>;
 return <section className="visual-lesson pairing-lesson" data-visual="pairing-lesson" aria-label={demo?'Stille demonstratie van koppelen':'Oefenen met koppelen'} onClick={e=>{if(demo&&!(e.target as Element).closest('button,input,a,select'))next();}}>
  <TutorialHeader practice={!demo} disabled={disabled||busy} onRestart={restart} onSkip={()=>void finish(true)} skipLabel="Koppeltutorial overslaan"/>
  {demo?<><TutorialPicture disabled={disabled||busy} onNext={next} lastStep={step===steps-1}>{scene}</TutorialPicture><TutorialSteps step={step} steps={steps}/></>:<>{scene}<div className="code-actions"><button className="btn light icon-only" disabled={busy||!value} aria-label="Laatste oefenvorm wissen" onClick={()=>{setValue(v=>v.slice(0,-1));setWrong(false);}}><Eraser/></button><button className="btn icon-only" aria-label="Oefenkoppeling bevestigen" disabled={disabled||busy||value.length!==4} onClick={()=>{if(value!==sample){setWrong(true);setValue('');cue('error');return;}void finish();}}>{busy?<span className="loader"/>:<Check/>}</button></div></>}
  {wrong&&<div className="visual-error" role="alert" aria-label="Probeer opnieuw"><X/><RotateCcw/></div>}
 </section>;
}
