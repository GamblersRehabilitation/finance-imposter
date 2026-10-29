import {AbsoluteFill,CanvasImage,interpolate,Sequence,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {ArrowRight,BellRing,CarFront,Check,Circle,Coins,Flag,House,Hourglass,LockKeyhole,Monitor,Pointer,RotateCcw,ShieldCheck,ShoppingBag,Smartphone,Spade,Square,Star,Triangle,Watch} from 'lucide-react';

const blue='#47869d',gold='#76603c';
const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
/** Screenshots come from the real Player/CodePopup/TheftControls/BlackMarket screens. */
export function GameShot({file,width=350,top=65,pan=0}:{file:string;width?:number;top?:number;pan?:number}){
 const frame=useCurrentFrame(),{fps,durationInFrames}=useVideoConfig();
 return <AbsoluteFill style={{background:'#edf6fa',overflow:'hidden'}}><CanvasImage src={staticFile(`gambler-help/${file}.png`)} premountFor={fps} style={{position:'absolute',width,left:(390-width)/2,top:top-interpolate(frame,[fps,Math.max(fps+1,durationInFrames-fps)],[0,pan],clamp),height:'auto',borderRadius:16}}/></AbsoluteFill>;
}
function Tap({x,y}:{x:number;y:number}){const frame=useCurrentFrame(),{fps}=useVideoConfig();return <><div style={{position:'absolute',left:x-24,top:y-24,width:48,height:48,border:`3px solid ${blue}`,borderRadius:'50%',opacity:1-(frame%fps)/fps,scale:1+(frame%fps)/fps}}/><Pointer size={43} stroke={gold} fill="#fffaf0" style={{position:'absolute',left:x-12,top:y-4}}/></>;}
function Focus({x,y,w,h}:{x:number;y:number;w:number;h:number}){return <div style={{position:'absolute',left:x,top:y,width:w,height:h,border:`3px solid ${blue}`,borderRadius:12,boxShadow:'0 0 0 1200px #203a4725'}}/>;}
function Banner({children}:{children:React.ReactNode}){return <div style={{position:'absolute',left:20,right:20,top:14,minHeight:44,padding:10,borderRadius:14,background:'#dceef6',color:gold,display:'flex',justifyContent:'center',alignItems:'center',gap:12,fontFamily:'Arial',fontSize:24,fontWeight:700}}>{children}</div>;}
export function GoalScene(){return <><GameShot file="goal" top={130}/><Banner><Watch/><CarFront/><House/><ArrowRight/><Flag/></Banner><div style={{position:'absolute',top:550,left:52,right:52,display:'flex',justifyContent:'center',gap:15,color:gold,alignItems:'center'}}><Coins size={35}/><ArrowRight/><ShoppingBag size={40}/><ArrowRight/><Check size={35}/></div><Focus x={33} y={215} w={324} h={105}/></>;}
export function FindCashScene(){return <><GameShot file="steal" top={80}/><Banner><Monitor/><Coins/><ArrowRight/><Smartphone/></Banner><Tap x={195} y={282}/></>;}
export function CodeScene(){const frame=useCurrentFrame(),{fps}=useVideoConfig();return <><GameShot file={frame<4*fps?'code-empty':'code-filled'} width={390} top={0}/><Banner><Monitor/><Circle size={23}/><Square size={23}/><Star size={23}/><Triangle size={23}/></Banner>{frame<4*fps?<Tap x={[83,291,187,187][Math.min(3,Math.floor(frame/fps))]} y={Math.floor(frame/fps)===2?536:453}/>:<Tap x={306} y={616}/>}</>;}
export function LockScene(){return <><GameShot file="lock-crop" top={4}/><Focus x={46} y={369} w={250} h={45}/><Tap x={194} y={687}/><Banner><LockKeyhole/><span>1 → 2 → 3 → 4</span><Check/></Banner></>;}
export function PipeScene(){const frame=useCurrentFrame(),{fps}=useVideoConfig();return <><GameShot file={frame<4*fps?'pipes':'pipes-solved'} top={-10}/><Banner><RotateCcw/><ArrowRight/><Coins/><ArrowRight/><ShieldCheck/></Banner>{frame<4*fps?<Tap x={92+(Math.floor(frame/fps)%3)*100} y={250+Math.floor(frame/(2*fps))*100}/>:<Tap x={242} y={675}/>}</>;}
export function CashoutScene(){const frame=useCurrentFrame(),{fps}=useVideoConfig(),pan=interpolate(frame,[2*fps,4*fps],[0,350],clamp);return <><GameShot file="cashout" top={25-pan}/><Banner><Coins/><ArrowRight/><ShieldCheck/></Banner>{frame>4*fps?<Tap x={195} y={675}/>:frame<2*fps?<Focus x={40} y={160} w={310} h={48}/>:null}</>;}
export function PaidScene(){return <><GameShot file="paid-goal" top={100}/><Banner><Coins/><span>+ € 3.500</span><Check/></Banner><div style={{position:'absolute',top:540,left:35,right:35,display:'flex',alignItems:'center',justifyContent:'center',gap:12,color:gold,fontSize:28,fontFamily:'Arial'}}><Hourglass/><b>30</b><ArrowRight/><Monitor/><ShieldCheck/></div></>;}
export function FundScene(){return <><GameShot file="shop0" width={210} top={80}/><Banner><BellRing/><RotateCcw/><Coins/><ArrowRight/><ShoppingBag/></Banner></>;}
export function BuyWatchScene(){const frame=useCurrentFrame(),{fps}=useVideoConfig();return frame<3*fps?<><GameShot file="shop0" top={90}/><Banner><Watch/><Coins/><ArrowRight/><ShoppingBag/></Banner><Tap x={195} y={513}/></>:<><GameShot file="goal1" top={130}/><Banner><Watch/><Check/><span>1 / 3</span></Banner></>;}
export function BuyCarScene(){const frame=useCurrentFrame(),{fps}=useVideoConfig();return frame<2*fps?<><GameShot file="shop0" top={-245}/><Banner><CarFront/><Coins/><ArrowRight/><ShoppingBag/></Banner><Tap x={195} y={519}/></>:<><GameShot file="goal2" top={130}/><Banner><Watch/><Check/><CarFront/><Check/><span>2 / 3</span></Banner></>;}
export function BuyVillaScene(){return <><GameShot file="villa-phone" width={390} top={-24}/><Banner><Watch/><Check/><CarFront/><Check/><House/></Banner><Tap x={195} y={709}/></>;}
export function VictoryScene(){return <><GameShot file="win-phone" width={390} top={-110}/><Banner><Watch/><Check/><CarFront/><Check/><House/><Check/></Banner><div style={{position:'absolute',left:44,right:44,bottom:65,padding:24,borderRadius:16,background:'#e6efdf',color:'#55794d',display:'flex',alignItems:'center',justifyContent:'center',gap:20,fontSize:34,fontFamily:'Arial'}}><ShoppingBag/><b>3 / 3</b><ArrowRight/><Spade/><Flag/></div></>;}
export function GamblerWalkthrough(){const {fps}=useVideoConfig();return <AbsoluteFill>
 <Sequence name="Drie aankopen vormen het doel" from={0} durationInFrames={6*fps} premountFor={fps}><GoalScene/></Sequence>
 <Sequence name="Kaslaptop vinden en code openen" from={6*fps} durationInFrames={5*fps} premountFor={fps}><FindCashScene/></Sequence>
 <Sequence name="Vormen van de laptop overnemen" from={11*fps} durationInFrames={7*fps} premountFor={fps}><CodeScene/></Sequence>
 <Sequence name="Vier pinnen op de gouden zone stoppen" from={18*fps} durationInFrames={7*fps} premountFor={fps}><LockScene/></Sequence>
 <Sequence name="Of de geldroute aansluiten en bevestigen" from={25*fps} durationInFrames={8*fps} premountFor={fps}><PipeScene/></Sequence>
 <Sequence name="Verdiende buit veilig innen" from={33*fps} durationInFrames={6*fps} premountFor={fps}><CashoutScene/></Sequence>
 <Sequence name="Rekening gevuld, kasmelding na dertig seconden" from={39*fps} durationInFrames={5*fps} premountFor={fps}><PaidScene/></Sequence>
 <Sequence name="Nieuwe rondes sparen voor de winkel" from={44*fps} durationInFrames={5*fps} premountFor={fps}><FundScene/></Sequence>
 <Sequence name="Horloge kopen" from={49*fps} durationInFrames={5*fps} premountFor={fps}><BuyWatchScene/></Sequence>
 <Sequence name="Auto kopen" from={54*fps} durationInFrames={4*fps} premountFor={fps}><BuyCarScene/></Sequence>
 <Sequence name="Villa als laatste aankoop" from={58*fps} durationInFrames={5*fps} premountFor={fps}><BuyVillaScene/></Sequence>
 <Sequence name="Samen alle drie gekocht, Gokkers winnen" from={63*fps} durationInFrames={5*fps} premountFor={fps}><VictoryScene/></Sequence>
 </AbsoluteFill>;}
