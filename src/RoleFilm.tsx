import {useEffect,useRef,useState} from 'react';
import {Pause,Play,RotateCcw,Volume2,VolumeX} from 'lucide-react';
import {RoleIcon} from './ui';
import {ROLE_FILM_VERSION} from './roleLessonCatalog';

const AUDIO_PREFERENCE='fi-role-video-muted';
export function roleVideoMuted(){try{return localStorage.getItem(AUDIO_PREFERENCE)!=='off';}catch{return true;}}
export function saveRoleVideoMuted(muted:boolean){try{localStorage.setItem(AUDIO_PREFERENCE,muted?'on':'off');}catch{/* Playback still works without storage. */}}
export function roleVideoSource(role:string){return `/roles/${['employee','manager','security','gambler'].includes(role)?role:'employee'}.mp4?v=${ROLE_FILM_VERSION}`;}
const clock=(time:number)=>`${Math.floor(time/60)}:${String(Math.floor(time%60)).padStart(2,'0')}`;

/** Supplied films play in full; their audio is already attenuated in the media files. */
export function RoleVideo({role,source,poster,silent=false,videoLabel="Rolvideo"}:{role:string;source?:string;poster?:string;silent?:boolean;videoLabel?:string}){
 const video=useRef<HTMLVideoElement>(null),[ready,setReady]=useState(false),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0),[paused,setPaused]=useState(true),[finished,setFinished]=useState(false),[muted,setMuted]=useState(roleVideoMuted),[current,setCurrent]=useState(0),[duration,setDuration]=useState(0);
 function play(){const el=video.current;if(!el)return;if(el.ended)el.currentTime=0;void el.play().then(()=>{setReady(true);setFailed(false);}).catch(()=>setPaused(true));}
 useEffect(()=>{const el=video.current;if(!el)return;setReady(false);setFailed(false);setFinished(false);setCurrent(0);setDuration(0);const begin=()=>{setDuration(Number.isFinite(el.duration)?el.duration:0);play();};if(el.readyState>=1)begin();else el.addEventListener('loadedmetadata',begin,{once:true});return()=>{el.removeEventListener('loadedmetadata',begin);el.pause();};},[role,retry,source]);
 return <div className="role-film" aria-label={videoLabel}><div className="role-video-player supplied-role-video" aria-busy={!ready&&!failed}>
  <video ref={video} aria-label={source?videoLabel:"Persoonlijke roluitleg"} src={source??roleVideoSource(role)} poster={poster} muted={silent||muted} playsInline preload="auto" onLoadedData={()=>setReady(true)} onPlaying={()=>{setReady(true);setPaused(false);setFinished(false);}} onPause={()=>setPaused(true)} onTimeUpdate={()=>setCurrent(video.current?.currentTime??0)} onEnded={()=>{setFinished(true);setPaused(true);}} onError={()=>{setReady(false);setFailed(true);}}/>
  {!ready&&<div className="role-video-placeholder" aria-label={failed?'Rolvideo kon niet laden':'Rolvideo wordt geladen'}><RoleIcon role={role} size={64}/>{!failed&&<span className="loader"/>}</div>}
 </div><div className="role-film-controls">
  <button className="btn icon-only" data-sound="off" aria-label={failed?`${videoLabel} opnieuw laden`:finished?`${videoLabel} herhalen`:paused?`${videoLabel} afspelen`:`${videoLabel} pauzeren`} onClick={()=>{if(failed){video.current?.load();setRetry(n=>n+1);}else if(paused)play();else video.current?.pause();}}>{failed||finished?<RotateCcw/>:paused?<Play/>:<Pause/>}</button>
  {!silent&&<button className="btn light icon-only" data-sound="off" aria-label={muted?'Geluid van eigen rolvideo inschakelen':'Eigen rolvideo dempen'} aria-pressed={muted} onClick={()=>{const next=!muted;setMuted(next);saveRoleVideoMuted(next);if(video.current){video.current.muted=next;video.current.defaultMuted=next;}}}>{muted?<VolumeX/>:<Volume2/>}</button>}
  <span className="role-film-time">{clock(current)} / {clock(duration)}</span>
 </div><input className="role-film-seek" type="range" aria-label={source?"Positie in uitlegvideo":"Positie in rolvideo"} min="0" max={duration||1} step="0.1" value={Math.min(current,duration||1)} disabled={!duration||failed} onChange={e=>{const time=Number(e.currentTarget.value);if(video.current)video.current.currentTime=time;setCurrent(time);setFinished(false);}}/>
 </div>;
}
