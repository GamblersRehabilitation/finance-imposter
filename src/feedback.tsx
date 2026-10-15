import {useEffect,useState} from 'react';
import {Volume2,VolumeX} from 'lucide-react';
let context:AudioContext|undefined;
function enabled(){try{return localStorage.getItem('fi-sound')!=='off';}catch{return false;}}
export function unlockSound(){
  if(!enabled())return;
  try{context??=new AudioContext();if(context.state==='suspended')void context.resume().catch(()=>{});}catch{/* Audio remains optional. */}
}
export function usePhoneAudio(){
  useEffect(()=>{
    const unlock=()=>unlockSound();
    const visible=()=>{if(document.visibilityState==='visible'&&context)unlockSound();};
    document.addEventListener('pointerdown',unlock,true);
    document.addEventListener('keydown',unlock,true);
    document.addEventListener('visibilitychange',visible);
    return()=>{document.removeEventListener('pointerdown',unlock,true);document.removeEventListener('keydown',unlock,true);document.removeEventListener('visibilitychange',visible);};
  },[]);
}
export function cue(kind:'tap'|'success'|'error'|'alert'='tap'){
  if(!enabled())return;
  unlockSound();
  // Never queue an old notification while the browser is waiting for the first gesture.
  if(!context||context.state!=='running')return;
  try{
    const notes=kind==='success'?[520,660,880]:kind==='error'?[220,150]:kind==='alert'?[660,440,660]:[350];
    notes.forEach((frequency,i)=>{const o=context!.createOscillator(),gain=context!.createGain(),at=context!.currentTime+i*.11;o.frequency.value=frequency;gain.gain.setValueAtTime(.035,at);gain.gain.exponentialRampToValueAtTime(.001,at+.1);o.connect(gain);gain.connect(context!.destination);o.start(at);o.stop(at+.11);});
  }catch{/* Audio is optional on devices without Web Audio. */}
}
export function SoundToggle(){const [on,setOn]=useState(enabled);return <button className="sound-toggle" aria-label={on?'Geluid uitschakelen':'Geluid inschakelen'} title={on?'Geluid aan':'Geluid uit'} onClick={()=>{localStorage.setItem('fi-sound',on?'off':'on');setOn(!on);if(!on)cue();}}>{on?<Volume2 size={18}/>:<VolumeX size={18}/>}</button>;}
