import {z} from 'zod';
import {MAP_COLS,MAX_MAP_ROWS,floorRows,cellKey} from '../src/floorPlanRules.js';
import {financialTasks} from './puzzles.js';
const cell={x:z.number().int().min(0).max(MAP_COLS-1),y:z.number().int().min(0).max(MAX_MAP_ROWS-1)};
export const floorPlanSchema=z.object({rows:z.number().int().min(10).max(MAX_MAP_ROWS).optional(),walls:z.array(z.object(cell).strict()).max(MAP_COLS*MAX_MAP_ROWS),doors:z.array(z.object({...cell,axis:z.enum(['h','v'])}).strict()).max(MAP_COLS*MAX_MAP_ROWS),laptops:z.array(z.object({...cell,id:z.number().int().min(1).max(8),gameId:z.number().int().min(1).max(financialTasks.length)}).strict()).length(8)}).strict().superRefine((plan,ctx)=>{
 const all=[...plan.walls,...plan.doors,...plan.laptops];if(all.some(c=>c.y>=floorRows(plan)))ctx.addIssue({code:'custom',message:'Plaats alles binnen de hoogte van de kaart.'});if(new Set(all.map(cellKey)).size!==all.length)ctx.addIssue({code:'custom',message:'Muren, deuren en laptops moeten op verschillende vakken staan.'});
 if(new Set(plan.laptops.map(l=>l.id)).size!==8)ctx.addIssue({code:'custom',message:'Plaats elke laptop precies één keer.'});
 for(let i=0;i<8;i++)for(let j=i+1;j<8;j++)if(Math.hypot(plan.laptops[i].x-plan.laptops[j].x,plan.laptops[i].y-plan.laptops[j].y)<2)ctx.addIssue({code:'custom',message:'Laat minstens één vak ruimte tussen twee laptops.'});
});
