import {useEffect,useRef,useState} from 'react';
import {CircleHelp,X} from 'lucide-react';
import {RoleVideo} from './RoleFilm';

export const GAMBLER_GUIDE_VIDEO='/tutorials/gokker.mp4?v=20261029';
export function PurchaseGoalVideo({onClose}:{onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const el=dialog.current;el?.showModal();return()=>el?.close();},[]);
 return <dialog ref={dialog} className="role-intro-dialog wheel-video-dialog" aria-label="Uitleg van het aankoopdoel en geld stelen" onCancel={e=>{e.preventDefault();onClose();}}><div className="role-intro-controls"><button className="btn light icon-only" aria-label="Aankoopuitleg sluiten" onClick={onClose}><X/></button></div><RoleVideo role="gambler" source={GAMBLER_GUIDE_VIDEO} poster="/tutorials/gokker-poster.png" silent videoLabel="Gokker: doel, stelen en winnen"/></dialog>;
}
export function PurchaseGoalHelp(){
 const [open,setOpen]=useState(false);
 return <><button className="btn light icon-only purchase-goal-help" aria-label="Uitleg over de drie aankopen en winnen" onClick={()=>setOpen(true)}><CircleHelp/></button>{open&&<PurchaseGoalVideo onClose={()=>setOpen(false)}/>}</>;
}
