import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
/** One compact current snapshot; never append a history of whole games. */
export const encodeSnapshot=(state:string)=>'gz:'+gzipSync(state).toString('base64');
export const decodeSnapshot=(state:string)=>state.startsWith('gz:')?gunzipSync(Buffer.from(state.slice(3),'base64')).toString('utf8'):state;
const digest=(state:string)=>createHash('sha256').update(state).digest('base64url');
type Change={path:(string|number)[];op:'set'|'append'|'truncate';value:any};
function unpack(state:string){const data=JSON.parse(state);for(const row of data.sessions??[])if(typeof row.state==='string')row.state=JSON.parse(row.state);return data;}
function pack(data:any){for(const row of data.sessions??[])if(typeof row.state!=='string')row.state=JSON.stringify(row.state);return JSON.stringify(data);}
function changes(before:any,after:any,path:Change['path']=[],out:Change[]=[]):Change[]{
 if(JSON.stringify(before)===JSON.stringify(after))return out;
 if(Array.isArray(before)&&Array.isArray(after)){
  for(let i=0;i<Math.min(before.length,after.length);i++)changes(before[i],after[i],[...path,i],out);
  if(after.length>before.length)out.push({path,op:'append',value:after.slice(before.length)});
  else if(after.length<before.length)out.push({path,op:'truncate',value:after.length});
 }else if(before&&after&&typeof before==='object'&&typeof after==='object'&&!Array.isArray(before)&&!Array.isArray(after)&&JSON.stringify(Object.keys(before))===JSON.stringify(Object.keys(after))){
  for(const key of Object.keys(after))changes(before[key],after[key],[...path,key],out);
 }else out.push({path,op:'set',value:after});
 return out;
}
/** Only changed fields/new array entries travel; hashes reject incomplete or mismatched chains. */
export function encodeSnapshotDelta(state:string,previous?:string){
 const full=encodeSnapshot(state);if(previous===undefined)return full;
 const delta=`p1:${digest(previous)}:${digest(state)}:${gzipSync(JSON.stringify(changes(unpack(previous),unpack(state)))).toString('base64')}`;
 if(delta.length>=full.length)return full;
 try{return decodeSnapshotDelta(delta,previous)===state?delta:full;}catch{return full;}
}
export function decodeSnapshotDelta(delta:string,previous:string){
 if(!delta.startsWith('p1:'))return decodeSnapshot(delta);
 const [,base,checksum,payload]=delta.split(':');if(base!==digest(previous))throw new Error('Snapshot delta base mismatch');
 let data=unpack(previous);const operations=JSON.parse(gunzipSync(Buffer.from(payload,'base64')).toString('utf8')) as Change[];
 for(const change of operations){let target=data;const parts=change.op==='set'?change.path.slice(0,-1):change.path;for(const key of parts){if(!target||!Object.hasOwn(target,key))throw new Error('Invalid snapshot delta path');target=target[key];}
  if(change.op==='set'){if(!change.path.length)data=change.value;else Object.defineProperty(target,change.path.at(-1)!,{value:change.value,enumerable:true,configurable:true,writable:true});}
  else {if(!Array.isArray(target))throw new Error('Invalid snapshot delta array');if(change.op==='append'){for(const item of change.value)target.push(item);}else if(change.op==='truncate')target.length=change.value;else throw new Error('Invalid snapshot delta operation');}
 }
 const state=pack(data);
 if(digest(state)!==checksum)throw new Error('Snapshot delta checksum mismatch');return state;
}
