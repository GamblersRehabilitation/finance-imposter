import {AbsoluteFill} from 'remotion';
import {WheelBoard} from '../../src/WheelBoard';
/** Capture the real wheel component without its stationary pointer for the spin overlay. */
export function WheelDiscCapture(){return <AbsoluteFill className="wheel-disc-capture" style={{background:'transparent'}}>
 <style>{`.wheel-disc-capture>*:not(.real-wheel-wrap):not(style){display:none!important}.wheel-disc-capture>.real-wheel-wrap{display:block!important;position:absolute;inset:0;width:235px;height:235px;margin:0!important}.wheel-disc-capture .real-wheel{width:235px;height:235px}.wheel-disc-capture .wheel-pointer{display:none!important}`}</style>
 <WheelBoard gambler={{balance:5000,maxStake:8400,spinsRemaining:2}} stake={1000} onStake={()=>{}} onStart={()=>{}} balance={5000}/>
 </AbsoluteFill>;}
