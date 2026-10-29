/** Euro amounts scale with the classroom; task difficulty stays unchanged. */
export const TASK_REWARD=10000;
export function economyFor(players:number){const n=Math.max(1,players);return {startCapital:Math.max(15000,n*3000),companyGoal:Math.max(15000,n*3000)+n*64000,gamblerGoal:Math.max(40000,n*20000),theftAmount:Math.max(1500,n*250)};}
export const theftLimits=(base:number)=>({min:base,max:base*6});
export const theftThreshold=(companyGoal:number)=>Math.max(25,Math.round(companyGoal*8/35));
export const maxWheelStake=(goal:number)=>Math.max(5000,Math.floor(goal*.03));
export const SPINS_PER_ROUND=2;
export function shopCatalog(goal:number){return [{id:'watch',name:'Gouden horloge',icon:'watch',price:Math.max(1,Math.round(goal*.15))},{id:'car',name:'Exclusieve sportauto',icon:'car',price:Math.max(1,Math.round(goal*.4))},{id:'villa',name:'Villa aan zee',icon:'villa',price:Math.max(1,Math.round(goal*.8))}];}
/** Ownership, shared by the team, decides victory; cash alone never does. */
export function purchaseGoal(goal:number,purchases:{itemId:string}[]){const shop=shopCatalog(goal).map(item=>({...item,owned:purchases.some(p=>p.itemId===item.id)}));return {shop,owned:shop.filter(item=>item.owned).length,total:shop.length,price:shop.reduce((sum,item)=>sum+item.price,0),unbought:shop.filter(item=>!item.owned).reduce((sum,item)=>sum+item.price,0),complete:shop.every(item=>item.owned)};}

export const taskFailureCost=(theftAmount:number|null,reward:number)=>Math.max(1,theftAmount??Math.round(reward*.1));
