import {useRef,useState} from 'react';
import {RotateCcw,X} from 'lucide-react';
import {VisualBoard,practicePuzzle} from './VisualFinance';
import {VisualParts} from './VisualSymbols';
import {TutorialHeader,TutorialSteps,TutorialPicture} from './TutorialNavigation';
import {cue} from './feedback';
type Answer=number|{matches:number[]};

/** Teach only the current part. Success goes straight to its real task. */
export function FinanceLesson({gameId=1,sequence=[gameId,13,14],initialStage=0,currentKind,disabled,onComplete,onClose}:{gameId?:number;currentKind?:string;sequence?:number[];initialStage?:number;disabled:boolean;onComplete:()=>Promise<void>;onClose?:()=>void}){
 const [demo,setDemo]=useState(true),[step,setStep]=useState(0),[wrong,setWrong]=useState(false),[busy,setBusy]=useState(false),[version,setVersion]=useState(0),lock=useRef(false);
 const mode=sequence[initialStage]??gameId;
 const sample=(demonstration:boolean)=>practicePuzzle(0,demonstration,mode,({2:'invoice',3:'exchange',4:'saving',8:'portfolio',9:'payroll',10:'vat'} as Record<number,string>)[mode]===currentKind);
 const example=sample(true),classification=['currency-route','maturity-file','risk-route','tax-file'].includes(example.kind),steps=classification?example.details.values.length*2+2:example.kind==='matching'?8:7;
 function next(){if(disabled||busy)return;cue('select');if(step<steps-1)setStep(n=>n+1);else{setDemo(false);setWrong(false);}}
 function restart(){setDemo(true);setStep(0);setVersion(n=>n+1);setWrong(false);cue('back');}
 async function finish(){if(lock.current||disabled)return;lock.current=true;setBusy(true);try{await onComplete();cue('confirm');}catch{setWrong(true);cue('error');}finally{lock.current=false;setBusy(false);}}
 async function answer(value:Answer){if(lock.current||disabled)return;const p=sample(false),correct=p.kind==='matching'?typeof value!=='number'&&JSON.stringify(value.matches)===JSON.stringify(p.matching.solution):value===p.answer;if(!correct){setWrong(true);cue('error');return;}cue('success');await finish();}
 const board=<VisualBoard key={`${demo}-${version}`} stage={initialStage} puzzle={demo?example:sample(false)} disabled={disabled||demo||busy} demo={demo} demoStep={step} onAnswer={value=>void answer(value)}/>;
 return <section className="visual-lesson expanded-tutorial finance-part-lesson" data-visual="finance-lesson" aria-label={`Uitleg voor onderdeel ${initialStage+1}`} onClick={e=>{if(demo&&!(e.target as Element).closest('button,input,a,select'))next();}}>
  <TutorialHeader practice={!demo} disabled={disabled||busy} onRestart={restart} onSkip={onClose??(()=>void finish())}/>
  <VisualParts stage={initialStage} gameId={gameId} sequence={sequence}/>
  {demo?<><TutorialPicture disabled={disabled||busy} onNext={next} lastStep={step===steps-1}>{board}</TutorialPicture><TutorialSteps step={step} steps={steps}/></>:board}
  {wrong&&<div className="visual-error" role="alert" aria-label="Probeer opnieuw; oefenen kost geen geld"><X/><RotateCcw/></div>}{busy&&<span className="loader"/>}
 </section>;
}
