import {pipePorts,type PipeBoard} from '../src/theftRules';
/** Independent route search used to verify generated puzzles through the real action API. */
export function solvePipeBoard(board:PipeBoard):number[]{
 const rotations=board.tiles.map(t=>t.rotation);
 function visit(cell:number,entry:number,seen:number[]):boolean{
  for(let r=0;r<4;r++){
   const ports=pipePorts(board.tiles[cell].kind,r);if(!ports.includes(entry))continue;
   rotations[cell]=r;if(cell===11&&ports.includes(2))return true;
   const x=cell%3,y=Math.floor(cell/3);
   for(const out of ports){if(out===entry)continue;const nx=x+[0,1,0,-1][out],ny=y+[-1,0,1,0][out],next=ny*3+nx;
    if(nx>=0&&nx<3&&ny>=0&&ny<4&&!seen.includes(next)&&visit(next,(out+2)%4,[...seen,next]))return true;
   }
  }
  return false;
 }
 if(!visit(0,0,[0]))throw new Error('Gegenereerde route heeft geen oplossing.');return rotations;
}
