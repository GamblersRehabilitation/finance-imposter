import {MAX_OPEN_TASKS} from '../src/taskRules.js';
/** Keep active/checkpointed work when shrinking an older queue. Presentation is always numeric. */
export function limitAssignments(ids:number[],priority:number[]=[]){
 const valid=[...new Set(ids)].filter(id=>Number.isInteger(id)&&id>=1&&id<=8);
 const kept=[...priority.filter(id=>valid.includes(id)),...valid.sort((a,b)=>a-b)];
 return [...new Set(kept)].slice(0,MAX_OPEN_TASKS).sort((a,b)=>a-b);
}
export function drawAssignments(ids:number[],choose:(max:number)=>number,unfinished:number[]=[]){
 const assigned=limitAssignments(ids,unfinished),pool=Array.from({length:8},(_,i)=>i+1).filter(id=>!assigned.includes(id));
 for(let i=pool.length-1;i>0;i--){const j=choose(i+1);[pool[i],pool[j]]=[pool[j],pool[i]];}
 const next=[...pool.filter(id=>unfinished.includes(id)),...pool.filter(id=>!unfinished.includes(id))];
 return [...assigned,...next.slice(0,Math.min(2,MAX_OPEN_TASKS-assigned.length))].sort((a,b)=>a-b);
}
