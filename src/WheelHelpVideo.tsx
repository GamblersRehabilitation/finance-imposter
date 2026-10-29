import {useEffect,useRef} from 'react';
import {Coins,Hand,RotateCw,ShieldCheck,X} from 'lucide-react';
import {RoleVideo} from './RoleFilm';
export const WHEEL_HELP_VIDEO='/tutorials/gokrad.mp4?v=20261028';
export function WheelHelpVideo({disabled,onClose,onPractice}:{disabled:boolean;onClose:()=>void;onPractice:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const el=dialog.current;el?.showModal();return()=>el?.close();},[]);
 return <dialog ref={dialog} className="role-intro-dialog wheel-video-dialog" aria-label="Uitlegvideo van het gokrad" onCancel={e=>{e.preventDefault();if(!disabled)onClose();}}><div className="role-intro-controls"><button className="btn light icon-only" aria-label="Gokrad-uitleg sluiten" disabled={disabled} onClick={onClose}><X/></button></div><RoleVideo role="gambler" source={WHEEL_HELP_VIDEO} poster="/tutorials/gokrad-poster.png" silent videoLabel="Gokrad-uitlegvideo"/><button className="btn full wheel-video-practice" aria-label="Zelf oefenen zonder echte inzet" disabled={disabled} onClick={onPractice}><Hand/><RotateCw/><Coins/><ShieldCheck/></button></dialog>;
}
