import React from 'react';
import {AbsoluteFill,interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
type Role='employee'|'manager'|'security'|'gambler';
const brown='#705d3c',green='#65846b',red='#ba544e',paper='#fffaf5';
function Icon({kind,x=0,y=0,size=70,color=brown}:{kind:string;x?:number;y?:number;size?:number;color?:string}){
 return <g transform={`translate(${x},${y}) scale(${size/80})`} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
 {kind==='phone'?<><rect x="17" y="4" width="46" height="72" rx="7"/><path d="M31 12h18M35 68h10m-19-36 6 6 12-13M26 49h26"/></>:
 kind==='laptop'?<><rect x="8" y="12" width="64" height="46" rx="5"/><path d="M2 68h76l-6-10H8Zm23-23 10 10 21-22"/></>:
 kind==='cash'?<><rect x="5" y="15" width="70" height="48" rx="6"/><circle cx="40" cy="39" r="17"/><path d="M47 28c-17-10-21 30 0 22M27 36h18M26 43h17"/></>:
 kind==='people'?<>{[15,40,65].map((n,i)=><g key={n}><circle cx={n} cy={i===1?19:27} r="9"/><path d={`M${n-11} 67v-17q11-17 22 0v17`}/></g>)}</>:
 kind==='talk'?<><path d="M7 12h66v43H41L24 71V55H7Z"/>{[25,40,55].map(n=><circle key={n} cx={n} cy="33" r="2" fill={color}/>)}</>:
 kind==='door'?<><path d="M16 72V8h44v64M8 72h64M45 39v7M61 43h17m-7-7 7 7-7 7"/><circle cx="32" cy="28" r="7"/><path d="M23 57V46q9-12 18 0v11"/></>:
 kind==='scan'?<><path d="M22 7H7v15m51-15h15v15M7 58v15h15m36 0h15V58"/><rect x="21" y="25" width="38" height="27" rx="3"/><path d="M16 60h48M10 40h60" stroke={green}/></>:
 kind==='clock'?<><circle cx="34" cy="33" r="23"/><path d="M34 18v15l12 9M51 52l21 21"/></>:
 kind==='shield'?<><path d="M40 5 69 17v23Q65 62 40 75 15 62 11 40V17Z"/><path d="m25 39 10 10 21-23"/></>:
 kind==='bag'?<><path d="m24 10 9 16h14l9-16ZM33 26C2 46 8 73 40 73s38-27 7-47"/><path d="M47 41c-17-10-21 30 0 20M29 47h17M29 53h15"/></>:
 <><path d="M40 4C32 18 9 29 9 45c0 19 22 20 31 8 9 12 31 11 31-8C71 29 48 18 40 4Z"/><path d="m40 53-9 23h18Z"/></>}
 </g>;
}
function Check({x,y,p}:{x:number;y:number;p:number}){return <path d={`M${x} ${y}l10 10 20-24`} stroke={green} strokeWidth="6" fill="none" strokeDasharray="50" strokeDashoffset={50*(1-p)} strokeLinecap="round"/>;}
export const RoleMovie:React.FC<{role:Role}>=({role})=>{
 const frame=useCurrentFrame(),{fps,durationInFrames}=useVideoConfig(),t=frame/fps;
 const p=(start:number,end:number)=>interpolate(t,[start,end],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 const stages=role==='employee'?['phone','laptop','cash']:role==='manager'?['people','talk','door']:role==='security'?['cash','scan','clock']:['laptop','bag','wheel'];
 const active=Math.min(2,Math.floor(t/3)),roleIcon=role==='employee'?'laptop':role==='manager'?'people':role==='security'?'shield':'spade';
 return <AbsoluteFill style={{background:'#f6eee6'}}><svg width="640" height="360" viewBox="0 0 640 360">
 <rect x="13" y="13" width="614" height="334" rx="23" fill={paper} stroke="#e9dfd2"/><Icon kind={roleIcon} x={27} y={25} size={38}/>
 {[0,1,2].map(n=><circle key={n} cx={285+n*35} cy="43" r="5" fill={n<=active?brown:'#e3d9ca'}/>)}
 {stages.map((kind,i)=>{const x=35+i*200,local=p(i*3+.1,i*3+.65),complete=p(i*3+1.7,i*3+2.4),y=116-Math.sin(local*Math.PI)*8;return <g key={i} opacity={t>=i*3?1:.24}>
 <rect x={x} y="94" width="170" height="192" rx="17" fill={active===i?'#f0e7d8':'#f7f1ea'} stroke={active===i?brown:'#e9dfd2'} strokeWidth="2"/>
 {kind==='wheel'?<g transform={`translate(${x+85},165) rotate(${p(6,8.6)*1125})`}>{Array.from({length:8},(_,n)=><path key={n} d="M0 0 0-52A52 52 0 0 1 36.77-36.77Z" transform={`rotate(${n*45})`} fill={n%2?green:brown} stroke={paper} strokeWidth="1"/>)}<circle r="10" fill={paper}/></g>:<Icon kind={kind} x={x+45} y={y} size={80} color={role==='security'&&i===0?red:brown}/>}
 {role==='security'&&i===0?<><path d={`M${x+25} 229h120`} stroke="#e1d5c7" strokeWidth="11" strokeLinecap="round"/><path d={`M${x+25} 229h${100-45*complete}`} stroke={green} strokeWidth="11" strokeLinecap="round"/><path d={`M${x+80} 229h${45*complete}`} stroke={red} strokeWidth="11"/><circle cx={x+135} cy="115" r="12" fill={red}/><path d={`M${x+135} 108v7m0 5v1`} stroke="white" strokeWidth="3"/></>:
 role==='manager'&&i===2?<g opacity={complete}><path d={`M${x+57} 235l20 20m0-20-20 20`} stroke={red} strokeWidth="6"/><Icon kind="people" x={x+90} y={232} size={35} color={green}/></g>:
 role==='gambler'&&i===2?<><path d={`M${x+85} 101l-8-14h16Z`} fill={red}/><g opacity={p(8.6,9)}><path d={`M${x+59} 224l15 15m0-15-15 15`} stroke={green} strokeWidth="4"/><text x={x+83} y="244" fill={green} fontSize="33" fontFamily="Arial" fontWeight="bold">2</text></g></>:
 role==='security'&&i===2?<g opacity={complete}><path d={`M${x+25} 247h110`} stroke={brown} strokeWidth="2"/>{[40,85,120].map(n=><circle key={n} cx={x+n} cy="247" r="6" fill={n===85?red:green}/>)}</g>:<Check x={x+70} y={241} p={complete}/>}
 {i<2&&<g opacity={p(i*3+2.3,i*3+2.8)}><path d={`M${x+177} 183h17m-6-6 7 6-7 6`} fill="none" stroke={brown} strokeWidth="3"/></g>}
 </g>;})}
 <path d="M40 319H600" stroke="#e9dfd2" strokeWidth="4" strokeLinecap="round"/><path d={`M40 319H${40+560*frame/(durationInFrames-1)}`} stroke={brown} strokeWidth="4" strokeLinecap="round"/>
 </svg></AbsoluteFill>;
};
