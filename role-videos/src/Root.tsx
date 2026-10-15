import {Composition} from 'remotion';
import {RoleMovie} from './Composition';
export const RemotionRoot=()=> <>
 <Composition id="employee" component={RoleMovie} defaultProps={{role:'employee'}} durationInFrames={300} fps={30} width={640} height={360}/>
 <Composition id="manager" component={RoleMovie} defaultProps={{role:'manager'}} durationInFrames={300} fps={30} width={640} height={360}/>
 <Composition id="security" component={RoleMovie} defaultProps={{role:'security'}} durationInFrames={300} fps={30} width={640} height={360}/>
 <Composition id="gambler" component={RoleMovie} defaultProps={{role:'gambler'}} durationInFrames={300} fps={30} width={640} height={360}/>
</>;
