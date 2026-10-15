export type PipeKind='straight'|'elbow'|'tee';
export interface PipeBoard {cols:3;rows:4;tiles:{kind:PipeKind;rotation:number}[]}
export const pipePorts=(kind:PipeKind,rotation:number)=>{
 const base=kind==='straight'?[0,2]:kind==='elbow'?[0,1]:[0,1,3];
 return base.map(d=>(d+rotation)%4);
};
export function tracePipes(board:PipeBoard,rotations:number[]){
 if(rotations.length!==12)return {connected:false,reached:[] as number[]};
 const ports=board.tiles.map((t,i)=>pipePorts(t.kind,rotations[i]));
 if(!ports[0].includes(0))return {connected:false,reached:[] as number[]};
 const reached=[0],queue=[0];
 while(queue.length){const cell=queue.shift()!,x=cell%3,y=Math.floor(cell/3);
   for(const direction of ports[cell]){const nx=x+[0,1,0,-1][direction],ny=y+[-1,0,1,0][direction],next=ny*3+nx;
     if(nx<0||nx>=3||ny<0||ny>=4||reached.includes(next)||!ports[next].includes((direction+2)%4))continue;
     reached.push(next);queue.push(next);
   }
 }
 return {connected:reached.includes(11)&&ports[11].includes(2),reached};
}
export const lockAngle=(offset:number,speed:number,elapsed:number)=>(offset+speed*elapsed/1000)%360;
export const angleDistance=(a:number,b:number)=>Math.abs(((a-b+540)%360)-180);
