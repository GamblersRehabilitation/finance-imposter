import type {Game} from './types.js';
/** A collected theft uses this player's cash terminal immediately, before the delayed debit. */
export function cashAccess(g:Game,playerId:string){
 const collected=g.thefts.filter(t=>t.playerId===playerId&&t.round===g.round);
 const remaining=Math.max(0,Math.min(2,g.config.moneyLaptops.length)-collected.length);
 return {remaining,laptops:remaining?g.config.moneyLaptops.filter(id=>!collected.some(t=>t.laptopId===id)):[]};
}
