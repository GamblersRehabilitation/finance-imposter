export const MAP_COLS=16,MAP_ROWS=14,MAX_MAP_ROWS=24;
export type MapCell={x:number;y:number};
export type MapDoor=MapCell&{axis:'h'|'v'};
export type MapLaptop=MapCell&{id:number;gameId:number};
export type FloorPlan={rows?:number;walls:MapCell[];doors:MapDoor[];laptops:MapLaptop[]};
export const floorRows=(plan:FloorPlan)=>plan.rows??10;
export function resizeFloorPlan(plan:FloorPlan,rows:number):FloorPlan{
 if(plan.laptops.some(l=>l.y>=rows))throw new Error('Verplaats eerst de laptops onder de nieuwe onderrand.');
 const old=floorRows(plan),walls=plan.walls.filter(c=>c.y<rows&&c.y!==old-1),doors=plan.doors.filter(c=>c.y<rows);
 // Preserve an existing outer boundary when increasing or reducing the room height.
 for(const c of plan.walls.filter(c=>c.y===old-1))walls.push({...c,y:rows-1});
 if(rows>old)for(const x of new Set(plan.walls.filter(c=>c.y===old-1&&plan.walls.some(a=>a.x===c.x&&a.y===old-2)).map(c=>c.x)))for(let y=old-1;y<rows-1;y++)walls.push({x,y});
 const occupied=new Set([...doors,...plan.laptops].map(cellKey));return {...plan,rows,walls:[...new Map(walls.filter(c=>!occupied.has(cellKey(c))).map(c=>[cellKey(c),c])).values()],doors};
}
export const cellKey=(cell:MapCell)=>`${cell.x}:${cell.y}`;
export function defaultFloorPlan():FloorPlan{
 const walls:MapCell[]=[];for(let y=0;y<MAP_ROWS;y++)for(let x=0;x<MAP_COLS;x++)if(x===0||x===15||y===0||y===MAP_ROWS-1||x===8||y===7)walls.push({x,y});
 const doors:MapDoor[]=[{x:4,y:7,axis:'h'},{x:12,y:7,axis:'h'},{x:8,y:3,axis:'v'},{x:8,y:10,axis:'v'}],keys=new Set(doors.map(cellKey));
 return {rows:MAP_ROWS,walls:walls.filter(c=>!keys.has(cellKey(c))),doors,laptops:[[2,3],[5,4],[10,3],[13,4],[2,10],[5,10],[10,10],[13,10]].map(([x,y],i)=>({id:i+1,x,y,gameId:i+1}))};
}
