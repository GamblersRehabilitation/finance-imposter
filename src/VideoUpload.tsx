import { useState } from 'react';
import { upload } from '@vercel/blob/client';
import { Check, Upload, Video } from 'lucide-react';
import { api, uuid } from './api';
import { Panel } from './ui';
import type { Game } from '../server/types';
export function VideoUpload({s,act,busy}:{s:Game;act:(name:string,data?:any)=>Promise<any>;busy:boolean}){
  const [file,setFile]=useState<File|null>(null),[progress,setProgress]=useState(0),[uploading,setUploading]=useState(false),[message,setMessage]=useState(''),[failed,setFailed]=useState(false);
  async function send(){if(!file)return;setUploading(true);setFailed(false);setMessage('Video uploaden…');setProgress(0);try{
    if(file.size>50*1024*1024)throw new Error('Kies een MP4 van maximaal 50 MB.');
    const health=await api('/health');let url:string;
    if(health.transport==='poll'){
      const result=await upload(`briefings/${s.id}/${uuid()}.mp4`,file,{access:'public',handleUploadUrl:`/api/sessions/${s.code}/video-upload`,contentType:'video/mp4',onUploadProgress:e=>setProgress(e.percentage)});url=result.url;
    }else url=await new Promise<string>((resolve,reject)=>{const xhr=new XMLHttpRequest();xhr.open('POST',`/api/sessions/${s.code}/video-file`);xhr.setRequestHeader('Content-Type','application/octet-stream');xhr.upload.onprogress=e=>{if(e.lengthComputable)setProgress(e.loaded/e.total*100);};xhr.onerror=()=>reject(new Error('Upload onderbroken. Probeer opnieuw.'));xhr.onload=()=>{try{const result=JSON.parse(xhr.responseText);if(xhr.status<200||xhr.status>=300)throw new Error(result.message??'Upload mislukt.');resolve(result.url);}catch(e){reject(e);}};xhr.send(file);});
    const saved=await act('configure',{config:{...s.config,introVideoUrl:url}});if(!saved)throw new Error('Video verstuurd, maar opslaan mislukt. Probeer opnieuw.');
    setMessage('Briefing opgeslagen. Het digibord speelt deze video bij de start.');setProgress(100);setFile(null);
  }catch(e){setFailed(true);setMessage((e as Error).message);}finally{setUploading(false);}}
  return <Panel title="Briefingvideo" eyebrow="JE EIGEN MP4"><div className="video-upload"><Video size={30}/><div><label>Kies een MP4 · maximaal 50 MB<input type="file" accept="video/mp4,.mp4" disabled={busy||uploading||s.phase!=='lobby'} onChange={e=>{setFile(e.target.files?.[0]??null);setMessage('');}}/></label><small>Online wordt de video openbaar via de videolink opgeslagen. Upload een MP4 met H.264 voor brede ondersteuning.</small></div><button type="button" className="btn" disabled={!file||busy||uploading||s.phase!=='lobby'} onClick={send}><Upload size={17}/>{uploading?'Uploaden…':'Upload en gebruik'}</button></div>{uploading&&<progress aria-label="Uploadvoortgang" max="100" value={progress}/>}<p role={failed?'alert':'status'}>{!failed&&progress===100&&<Check size={17}/>} {message}</p>{s.config.introVideoUrl&&<video key={s.config.introVideoUrl} controls playsInline preload="metadata" src={s.config.introVideoUrl} className="briefing-preview"/>}</Panel>;
}
