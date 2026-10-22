import {ChevronRight,Hand,RotateCcw,SkipForward} from 'lucide-react';
export function TutorialHeader({practice,disabled,onRestart,onSkip,skipLabel='Tutorial overslaan'}:{practice:boolean;disabled:boolean;onRestart:()=>void;onSkip:()=>void;skipLabel?:string}){
 return <div className="tutorial-toolbar" aria-label={practice?'Veilig oefenen':'Voorbeeld stap voor stap'}><button className="btn light icon-only" aria-label="Demonstratie herhalen" disabled={disabled} onClick={onRestart}><RotateCcw/></button><button className="btn light tutorial-skip" aria-label={skipLabel} disabled={disabled} onClick={onSkip}><SkipForward size={28}/></button></div>;
}
export function TutorialSteps({step,steps}:{step:number;steps:number}){
 return <div className="tutorial-navigation"><div className="tutorial-step-dots" role="progressbar" aria-label={`Voorbeeldstap ${step+1} van ${steps}`} aria-valuemin={0} aria-valuemax={steps} aria-valuenow={step+1}>{Array.from({length:steps},(_,i)=><i key={i} className={i===step?'current':i<step?'complete':''}/>)}</div></div>;
}
export function TutorialPicture({children,disabled,onNext,lastStep=false}:{children:React.ReactNode;disabled:boolean;onNext:()=>void;lastStep?:boolean}){
 return <div className="tutorial-picture">{children}<button className="tutorial-picture-next" aria-label={lastStep?'Zelf oefenen':'Tik op het uitlegbeeld om verder te gaan'} disabled={disabled} onClick={onNext}><span><Hand/><ChevronRight/></span></button></div>;
}
