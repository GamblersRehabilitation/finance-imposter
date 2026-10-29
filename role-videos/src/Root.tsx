import {Composition,Still} from 'remotion';
import {RoleMovie} from './Composition';
import {WheelWalkthrough} from './WheelWalkthrough';
import {WheelDiscCapture} from './WheelDiscCapture';
import {GamblerWalkthrough,GoalScene,FindCashScene,CodeScene,LockScene,PipeScene,CashoutScene,PaidScene,FundScene,BuyWatchScene,BuyCarScene,BuyVillaScene,VictoryScene} from './GamblerWalkthrough';
export const RemotionRoot=()=> <>
 <Composition id="gambler-walkthrough" component={GamblerWalkthrough} durationInFrames={2040} fps={30} width={390} height={780}/>
 <Composition id="gambler-goal" component={GoalScene} durationInFrames={180} fps={30} width={390} height={780}/>
 <Composition id="gambler-find-cash" component={FindCashScene} durationInFrames={150} fps={30} width={390} height={780}/>
 <Composition id="gambler-code" component={CodeScene} durationInFrames={210} fps={30} width={390} height={780}/>
 <Composition id="gambler-lock" component={LockScene} durationInFrames={210} fps={30} width={390} height={780}/>
 <Composition id="gambler-pipes" component={PipeScene} durationInFrames={240} fps={30} width={390} height={780}/>
 <Composition id="gambler-cashout" component={CashoutScene} durationInFrames={180} fps={30} width={390} height={780}/>
 <Composition id="gambler-paid" component={PaidScene} durationInFrames={150} fps={30} width={390} height={780}/>
 <Composition id="gambler-fund" component={FundScene} durationInFrames={150} fps={30} width={390} height={780}/>
 <Composition id="gambler-buy-watch" component={BuyWatchScene} durationInFrames={150} fps={30} width={390} height={780}/>
 <Composition id="gambler-buy-car" component={BuyCarScene} durationInFrames={120} fps={30} width={390} height={780}/>
 <Composition id="gambler-buy-villa" component={BuyVillaScene} durationInFrames={150} fps={30} width={390} height={780}/>
 <Composition id="gambler-victory" component={VictoryScene} durationInFrames={150} fps={30} width={390} height={780}/>
 <Still id="wheel-disc-capture" component={WheelDiscCapture} width={235} height={235}/>
 <Composition id="wheel-walkthrough" component={WheelWalkthrough} durationInFrames={900} fps={30} width={390} height={780}/>
 <Composition id="employee" component={RoleMovie} defaultProps={{role:'employee'}} durationInFrames={300} fps={30} width={390} height={640}/>
 <Composition id="manager" component={RoleMovie} defaultProps={{role:'manager'}} durationInFrames={1200} fps={30} width={390} height={640}/>
 <Composition id="security" component={RoleMovie} defaultProps={{role:'security'}} durationInFrames={1800} fps={30} width={390} height={640}/>
 <Composition id="gambler" component={RoleMovie} defaultProps={{role:'gambler'}} durationInFrames={1800} fps={30} width={390} height={640}/>
</>;
