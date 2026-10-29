import {AbsoluteFill,CanvasImage,Easing,interpolate,Sequence,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {ArrowDown,ArrowRight,BellRing,Coins,Pointer as HandPointer,RotateCw,Timer} from 'lucide-react';

// Pixel positions checked against the captured phone images (full-page capture hides the scrollbar).
const geometry={camera:2084,wheel:{x:77.5,y:2279.333,w:235},balance:{x:50,y:2538.333,w:290,h:32},stake:{x:54,y:2708,w:282,h:46},start:{x:147,y:2770,w:95,h:46},quota:{x:38.667,y:2582.333,w:312.667,h:32},result:{x:38.667,y:2816.333,w:312.667,h:24}};
const asset=(file:string)=>staticFile(`wheel-help/${file}.png`);
const gold='#846d43',blue='#43869e';
const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
function Focus({box,tap=false}:{box:{x:number;y:number;w:number;h:number};tap?:boolean}){
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),pulse=(frame/fps)%1;
 const x=box.x,y=box.y-geometry.camera;
 return <><div style={{position:'absolute',left:x-6,top:y-6,width:box.w+12,height:box.h+12,border:'3px solid #4b95ad',borderRadius:12,boxShadow:'0 0 0 1200px #263d4b38'}}/>{tap&&<><div style={{position:'absolute',left:x+box.w/2-20,top:y+box.h/2-20,width:40,height:40,border:'3px solid #4b95ad',borderRadius:'50%',scale:1+pulse*.8,opacity:1-pulse}}/><HandPointer size={46} fill="#fffaf2" stroke={gold} strokeWidth={1.7} style={{position:'absolute',left:x+box.w/2-15,top:y+box.h/2-4,rotate:'-12deg'}}/></>}</>;
}
function Shot({file,focus,tap=false,spin=false,scroll=false}:{file:string;focus?:keyof Omit<typeof geometry,'camera'|'wheel'>;tap?:boolean;spin?:boolean;scroll?:boolean}){
 const frame=useCurrentFrame(),{fps}=useVideoConfig();
 const camera=scroll?interpolate(frame,[.6*fps,2.6*fps],[0,geometry.camera],{...clamp,easing:Easing.inOut(Easing.cubic)}):geometry.camera;
 return <AbsoluteFill style={{background:'#f7f3eb',overflow:'hidden'}}>
  <CanvasImage src={asset(file)} premountFor={fps} style={{position:'absolute',width:374,height:'auto',left:0,top:-camera}}/>
  {scroll&&frame<2.5*fps&&<div style={{position:'absolute',left:171,top:560+interpolate(frame,[0,2*fps],[0,70],clamp),color:blue,background:'#e6f5fbd9',borderRadius:40,padding:8}}><ArrowDown size={42}/></div>}
  {spin&&<><div style={{position:'absolute',left:geometry.wheel.x,top:geometry.wheel.y-camera,width:geometry.wheel.w,height:geometry.wheel.w,borderRadius:'50%',overflow:'hidden'}}><div style={{position:'absolute',width:geometry.wheel.w,height:geometry.wheel.w,rotate:`${interpolate(frame,[0,5*fps],[0,2868.75],{...clamp,easing:Easing.bezier(.12,.68,.12,1)})}deg`}}><CanvasImage src={asset('disc')} premountFor={fps} style={{position:'absolute',width:geometry.wheel.w,height:geometry.wheel.w,left:0,top:0}}/></div></div><div style={{position:'absolute',top:730,left:147,display:'flex',alignItems:'center',gap:10,background:'#e6f5fb',padding:'8px 12px',borderRadius:12,color:blue,fontSize:23}}><Timer/>{Math.max(0,5-Math.floor(frame/fps))}</div></>}
  {focus&&<Focus box={geometry[focus]} tap={tap}/>}
 </AbsoluteFill>;
}
function Result({file,factor,payout}:{file:string;factor:string;payout:number}){
 const {fps}=useVideoConfig(),frame=useCurrentFrame();
 return <><Shot file={file} focus="balance"/><div style={{position:'absolute',left:16,right:16,top:12,padding:12,borderRadius:14,background:payout>1000?'#e3efdf':'#f6e8dc',border:`2px solid ${payout>1000?'#6c9564':'#ba8b6e'}`,color:'#54432e',fontWeight:700,fontFamily:'Arial,sans-serif'}}>
 <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,fontSize:21}}><Coins size={22}/><span>€ 1.000</span><span>{factor}</span><ArrowRight size={20}/><span>€ {payout.toLocaleString('nl-NL')}</span></div>
 <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:5,fontSize:17,marginTop:9,opacity:interpolate(frame,[.4*fps,.8*fps],[0,1],clamp)}}><Coins size={17}/><span>5.000 − 1.000 + {payout.toLocaleString('nl-NL')} = {(4000+payout).toLocaleString('nl-NL')}</span></div>
 </div><Sequence from={Math.round(.2*fps)} premountFor={fps}><HandPointer size={40} fill="#fffaf2" stroke={gold} style={{position:'absolute',left:180,top:466}}/></Sequence></>;
}
export function WheelWalkthrough(){const {fps}=useVideoConfig();return <AbsoluteFill style={{background:'#f7f3eb'}}>
 <Sequence name="Naar het rad scrollen" from={0} durationInFrames={3*fps} premountFor={fps}><Shot file="start" scroll/></Sequence>
 <Sequence name="Gezamenlijke buit" from={3*fps} durationInFrames={2*fps} premountFor={fps}><Shot file="start" focus="balance"/></Sequence>
 <Sequence name="Inzet kiezen" from={5*fps} durationInFrames={3*fps} premountFor={fps}><Shot file="stake" focus="stake" tap/></Sequence>
 <Sequence name="Draaiknop aantikken" from={8*fps} durationInFrames={fps} premountFor={fps}><Shot file="stake" focus="start" tap/></Sequence>
 <Sequence name="Wachten tot het rad stilstaat" from={9*fps} durationInFrames={5*fps} premountFor={fps}><Shot file="spinning" spin/></Sequence>
 <Sequence name="Tweemaal inzet terug" from={14*fps} durationInFrames={3*fps} premountFor={fps}><Result file="win" factor="×2" payout={2000}/></Sequence>
 <Sequence name="Driemaal inzet terug" from={17*fps} durationInFrames={3*fps} premountFor={fps}><Result file="triple" factor="×3" payout={3000}/></Sequence>
 <Sequence name="Halve inzet terug" from={20*fps} durationInFrames={3*fps} premountFor={fps}><Result file="half" factor="½" payout={500}/></Sequence>
 <Sequence name="Kwart inzet terug" from={23*fps} durationInFrames={3*fps} premountFor={fps}><Result file="quarter" factor="¼" payout={250}/></Sequence>
 <Sequence name="Twee spins na iedere meeting" from={26*fps} durationInFrames={4*fps} premountFor={fps}><Shot file="start" focus="quota"/><div style={{position:'absolute',left:64,right:64,bottom:25,padding:18,borderRadius:16,background:'#e6f5fb',display:'flex',alignItems:'center',justifyContent:'center',gap:14,color:blue}}><BellRing size={36}/><ArrowRight size={28}/><RotateCw size={32}/><RotateCw size={32}/></div></Sequence>
 </AbsoluteFill>;}
