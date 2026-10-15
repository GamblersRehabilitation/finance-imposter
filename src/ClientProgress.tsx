import {memo,useEffect,useRef} from 'react';
/** The compositor advances the fill; React and the network only supply new deadlines. */
export const ClientProgress=memo(function ClientProgress({start,end,now,paused=false,reverse=false,label}:{start:number;end:number;now:number;paused?:boolean;reverse?:boolean;label:string}){
 const fill=useRef<HTMLSpanElement>(null),p=Math.max(0,Math.min(1,(now-start)/(end-start)));
 useEffect(()=>{if(!fill.current||paused)return;const progress=Math.max(0,Math.min(1,(now-start)/(end-start)));const animation=fill.current.animate([{transform:`scaleX(${reverse?1-progress:progress})`},{transform:`scaleX(${reverse?0:1})`}],{duration:Math.max(1,end-now),fill:'forwards',easing:'linear'});return()=>animation.cancel();},[start,end,paused,reverse]);
 return <span className="client-progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((reverse?1-p:p)*100)}><span ref={fill} style={{transform:`scaleX(${reverse?1-p:p})`}}/></span>;
});
