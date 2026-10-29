import {BellRing,Coins,ArrowRight,RotateCw,Monitor} from 'lucide-react';
import {money} from './ui';
export function TheftQuota({gambler}:{gambler:any}){
 if(gambler.theftRemaining===undefined)return null;
 return <div className="theft-quota" role="status" aria-label={`Per keer minimaal ${money(gambler.theftMin)}; maximaal ${money(gambler.theftMax)} per kas; nog ${gambler.theftsRemaining??2} kasbeurten en ${money(gambler.theftRemaining)} beschikbaar deze meetingronde`}><span><Coins/>{money(gambler.theftMin)} ≤ <Coins/> ≤ {money(gambler.theftMax)}</span><span>{gambler.theftsRemaining!==undefined&&<><Monitor/>{gambler.theftsRemaining}/2</>}<RotateCw/><Coins/>{money(gambler.theftRemaining)}<BellRing/><ArrowRight/><RotateCw/></span></div>;
}
