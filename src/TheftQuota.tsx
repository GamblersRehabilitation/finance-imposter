import {BellRing,Coins,ArrowRight,RotateCw} from 'lucide-react';
import {money} from './ui';
export function TheftQuota({gambler}:{gambler:any}){
 if(gambler.theftRemaining===undefined)return null;
 return <div className="theft-quota" role="status" aria-label={`Per keer minimaal ${money(gambler.theftMin)}; maximaal ${money(gambler.theftMax)} per meetingronde; nog ${money(gambler.theftRemaining)} beschikbaar`}><span><Coins/>{money(gambler.theftMin)} ≤ <Coins/> ≤ {money(gambler.theftMax)}</span><span><RotateCw/><Coins/>{money(gambler.theftRemaining)}<BellRing/><ArrowRight/><RotateCw/></span></div>;
}
