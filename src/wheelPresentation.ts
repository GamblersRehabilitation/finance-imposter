export type WheelGate={id:string;balance:number;wealth?:number};
/** A fast server result cannot interrupt the phone's last animation frames. */
export function presentWheelResult(state:any,gate:WheelGate|null){
 if(!gate||state?.gambler?.lastSpin?.id!==gate.id)return state;
 const wealth=gate.wealth??(gate.balance+((state.gambler.wealth??state.gambler.balance)-state.gambler.balance));
 const ownWin=state.phase==='ended'&&state.endReason==='financial-goal'&&state.winner==='gamblers';
 return {...state,...(ownWin?{phase:'playing',winner:null,summary:null}:{}),gambler:{...state.gambler,balance:gate.balance,wealth,remaining:Math.max(0,state.gambler.goal-wealth),progress:state.gambler.goal?Math.min(1,wealth/state.gambler.goal):0}};
}
