import React from 'react';
import {AbsoluteFill,interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
import {roleChapters,ROLE_CHAPTER_SECONDS} from '../../src/roleLessonCatalog';
import {GamblerPhoneScene,ManagerPhoneScene,SecurityPhoneScene} from './PhoneScenes';
import '../../src/styles.css';
import './phone-scenes.css';
type Role='employee'|'manager'|'security'|'gambler';
export const RoleMovie:React.FC<{role:Role}>=({role})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),chapter=Math.min(roleChapters[role].length-1,Math.floor(frame/fps/ROLE_CHAPTER_SECONDS)),t=frame/fps-chapter*ROLE_CHAPTER_SECONDS,kind=roleChapters[role][chapter];
 const p=(a:number,b:number)=>interpolate(t,[a,b],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}),props={p,t,kind,role};
 return <AbsoluteFill style={{background:'#faf6ed'}}>{role==='security'?<SecurityPhoneScene {...props}/>:role==='gambler'?<GamblerPhoneScene {...props}/>:<ManagerPhoneScene {...props}/>}</AbsoluteFill>;
};
