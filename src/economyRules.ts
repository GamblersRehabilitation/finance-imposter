/** Euro amounts scale with the classroom; task difficulty stays unchanged. */
export const TASK_REWARD=5000;
export function economyFor(players:number){const n=Math.max(1,players);return {startCapital:Math.max(15000,n*3000),companyGoal:Math.max(15000,n*3000)+n*32000,gamblerGoal:Math.max(24000,n*12000),theftAmount:Math.max(100,n*50)};}
export const theftThreshold=(companyGoal:number)=>Math.max(25,Math.round(companyGoal*8/35));
export const maxWheelStake=(goal:number)=>Math.max(5000,Math.floor(goal*.03));
export const SPINS_PER_ROUND=2;
export function shopCatalog(goal:number){return [{id:'watch',name:'Gouden horloge',icon:'watch',price:Math.max(1,Math.round(goal*.15))},{id:'car',name:'Exclusieve sportauto',icon:'car',price:Math.max(1,Math.round(goal*.4))},{id:'villa',name:'Villa aan zee',icon:'villa',price:Math.max(1,Math.round(goal*.8))}];}

export const taskFailureCost=(theftAmount:number|null,reward:number)=>Math.max(1,theftAmount??Math.round(reward*.1));
