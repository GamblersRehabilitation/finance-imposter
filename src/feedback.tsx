import {useEffect,useState} from 'react';
import {Volume2,VolumeX} from 'lucide-react';
let context:AudioContext|undefined;
let lastCueAt=0,lastCueKind='';
const audioListeners=new Set<()=>void>();
const notifyAudio=()=>audioListeners.forEach(listener=>listener());
function enabled(){try{return localStorage.getItem('fi-sound')!=='off';}catch{return false;}}
export function unlockSound(){
  if(!enabled())return;
  try{if(!context||context.state==='closed'){context=new AudioContext();context.addEventListener?.('statechange',notifyAudio);}if(context.state!=='running')void context.resume().then(notifyAudio).catch(()=>{});notifyAudio();}catch{/* Audio remains optional. */}
}
export function usePhoneAudio(){
  useEffect(()=>{
    const unlock=()=>unlockSound();
    const visible=()=>{if(document.visibilityState==='visible'&&context)unlockSound();};
    document.addEventListener('pointerdown',unlock,true);
    document.addEventListener('keydown',unlock,true);
    document.addEventListener('visibilitychange',visible);
    const buttons=(event:MouseEvent)=>{const button=(event.target as Element)?.closest?.('button');if(!button||button.disabled||button.dataset.sound==='off')return;const clicked=Date.now();setTimeout(()=>{if(lastCueAt<clicked)cue('tap');},0);};
    document.addEventListener('click',buttons);
    return()=>{document.removeEventListener('pointerdown',unlock,true);document.removeEventListener('keydown',unlock,true);document.removeEventListener('visibilitychange',visible);document.removeEventListener('click',buttons);};
  },[]);
}
export function cue(kind:'tap'|'select'|'confirm'|'back'|'turn'|'success'|'error'|'alert'|'meeting'='tap'){
  if(!enabled())return;
  unlockSound();
  // Never queue an old notification while the browser is waiting for the first gesture.
  if(!context||context.state!=='running')return;
  const stamp=Date.now();if(lastCueKind===kind&&stamp-lastCueAt<45)return;lastCueAt=stamp;lastCueKind=kind;
  try{
    const notes=kind==='meeting'?[880,440,880,440,880,660]:kind==='success'?[520,660,880]:kind==='error'?[220,150]:kind==='alert'?[660,440,660]:kind==='select'?[440]:kind==='confirm'?[440,660]:kind==='back'?[440,330]:kind==='turn'?[300,350]:[350];
    notes.forEach((frequency,i)=>{const o=context!.createOscillator(),gain=context!.createGain(),at=context!.currentTime+i*(kind==='meeting'?.18:.11),duration=kind==='meeting'?.16:.1;o.frequency.value=frequency;gain.gain.setValueAtTime(kind==='meeting'?.24:kind==='alert'?.1:.035,at);gain.gain.exponentialRampToValueAtTime(.001,at+duration);o.connect(gain);gain.connect(context!.destination);o.start(at);o.stop(at+duration+.01);});
  }catch{/* Audio is optional on devices without Web Audio. */}
}
export function SoundToggle(){const [on,setOn]=useState(enabled),[ready,setReady]=useState(context?.state==='running');useEffect(()=>{const update=()=>setReady(context?.state==='running');audioListeners.add(update);update();return()=>{audioListeners.delete(update);};},[]);const activate=on&&!ready;return <button className="sound-toggle" data-audio-state={ready?'running':'waiting'} aria-label={activate?'Geluid activeren':on?'Geluid uitschakelen':'Geluid inschakelen'} onClick={()=>{if(activate){unlockSound();return;}localStorage.setItem('fi-sound',on?'off':'on');setOn(!on);if(!on)cue();}}>{on?<Volume2 size={18}/>:<VolumeX size={18}/>}</button>;}
