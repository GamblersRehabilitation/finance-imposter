import {randomInt,randomUUID} from 'node:crypto';
import {pipePorts,tracePipes,type PipeBoard} from '../src/theftRules.js';
import type {TheftState} from './types.js';
function shuffled<T>(values:T[]){for(let i=values.length-1;i>0;i--){const j=randomInt(i+1);[values[i],values[j]]=[values[j],values[i]];}return values;}
export function makePipeBoard():PipeBoard{
 let path:number[]=[];
 function visit(cell:number,seen:number[]):boolean{
  if(cell===11){if(seen.length>=10){path=seen;return true;}return false;}
  const x=cell%3,y=Math.floor(cell/3);
  return shuffled([0,1,2,3]).some(d=>{const nx=x+[0,1,0,-1][d],ny=y+[-1,0,1,0][d],next=ny*3+nx;return nx>=0&&nx<3&&ny>=0&&ny<4&&!seen.includes(next)&&visit(next,[...seen,next]);});
 }
 visit(0,[0]);
 const board:PipeBoard={cols:3,rows:4,tiles:Array.from({length:12},()=>({kind:(['straight','elbow','tee'] as const)[randomInt(3)],rotation:randomInt(4)}))};
 for(let i=0;i<path.length;i++){
   const cell=path[i],direction=(next:number)=>next===cell-3?0:next===cell+1?1:next===cell+3?2:3;
   const a=i===0?0:direction(path[i-1]),b=i===path.length-1?2:direction(path[i+1]);
   const kind=randomInt(5)===0?'tee':(a+2)%4===b?'straight':'elbow';
   // The solution is used only during generation; it is never stored or serialized.
   const solution=[0,1,2,3].find(r=>{const p=pipePorts(kind,r);return p.includes(a)&&p.includes(b);})!;
   board.tiles[cell]={kind,rotation:(solution+randomInt(1,4))%4};
 }
 while(tracePipes(board,board.tiles.map(t=>t.rotation)).connected)board.tiles.forEach(t=>t.rotation=randomInt(4));
 return board;
}
export function refreshTheftChallenge(state:TheftState,now:number){
 state.nonce=randomUUID();state.version=2;
 if(state.module==='diversion'){state.pipes=makePipeBoard();state.pipeStartedAt=now;state.pipeDeadline=now+Math.max(45,65-state.round*5)*1000;delete state.lock;}
 else{state.lock={startedAt:now,offset:randomInt(360),speed:100+((state.round-1)*4+state.step)*9,target:randomInt(360),width:Math.max(24,46-state.round*3-state.step*2)};delete state.pipes;delete state.pipeDeadline;delete state.pipeStartedAt;}
}
export function makeTheftState(module:'lockpick'|'diversion',now:number):TheftState{
 const state:TheftState={module,version:2,round:1,step:0,loot:0,target:0,nonce:randomUUID()};refreshTheftChallenge(state,now);return state;
}
