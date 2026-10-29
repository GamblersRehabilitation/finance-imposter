import { useCallback, useEffect, useRef, useState } from 'react';
import {applyStatePatch} from './stateTransport';
// getRandomValues also works on HTTP LAN addresses; randomUUID needs a secure context.
export function uuid(){const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const s=Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20)}`;}
export async function copyText(text:string){if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(text);return;}catch{}}const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();document.execCommand('copy');area.remove();}
export class ApiError extends Error {constructor(public code:string,message:string,public status:number){super(message);}}
export async function api(path:string, body?:unknown, token?:string|null) {
  const res=await fetch(`/api${path}`,{method:body===undefined?'GET':'POST',credentials:'same-origin',headers:{...(body!==undefined?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const data=await res.json();if(!res.ok)throw new ApiError(data.error??'REQUEST',data.message??'Verzoek mislukt.',res.status);return data;
}
/** A conditional private read can update the clock without downloading the view again. */
export async function pollSession(code:string,token:string|null,etag?:string,signal?:AbortSignal){
 const res=await fetch(`/api/sessions/${code}`,{credentials:'same-origin',signal,headers:{...(token?{Authorization:`Bearer ${token}`} :{}),...(etag?{'If-None-Match':etag}:{})}});
 const clock=res.headers.get('X-Server-Time'),serverTime=clock===null?undefined:Number(clock);
 if(res.status===304)return {etag:res.headers.get('ETag')??etag,serverTime};
 const state=await res.json();if(!res.ok)throw new ApiError(state.error??'REQUEST',state.message??'Verzoek mislukt.',res.status);
 return {state,etag:res.headers.get('ETag')??undefined,serverTime};
}
export function useGame(code:string|null,token:string|null=null) {
  const [state,setState]=useState<any>(null),[connected,setConnected]=useState(false),[error,setError]=useState(''),[offset,setOffset]=useState(0);
  const lastRevision=useRef(-1),activeIdentity=useRef('');activeIdentity.current=`${code}:${token}`;
  useEffect(()=>{if(!code)return;let stopped=false,lastSeen=Date.now(),ws:WebSocket,timeout:ReturnType<typeof setTimeout>,attempt=0,pollFailures=0,etag:string|undefined,socketView:any=null;const controller=new AbortController();setState(null);lastRevision.current=-1;
    const accept=(s:any)=>{if(s.revision>=lastRevision.current){setState(s);lastRevision.current=s.revision;setOffset(s.serverTime-Date.now());setError('');}};
    function connect(){if(stopped)return;socketView=null;const socket=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws`);ws=socket;socket.onopen=()=>socket.send(JSON.stringify({type:'auth',code,delta:true, ...(token?{token}:{})}));socket.onmessage=e=>{if(stopped)return;lastSeen=Date.now();try{const msg=JSON.parse(e.data);if(msg.type==='state'||msg.type==='patch'){const next=msg.type==='state'?msg.state:applyStatePatch(socketView,msg);if(!next){socket.close();return;}socketView=next;accept(next);setConnected(true);attempt=0;}if(msg.type==='clock')setOffset(msg.serverTime-Date.now());}catch{socket.close();}};socket.onerror=()=>{if(!stopped)setConnected(false);};socket.onclose=e=>{if(stopped)return;setConnected(false);if(e.code===4001){setError('Koppeling verlopen. Open je herstellink of meld opnieuw aan.');return;}timeout=setTimeout(connect,Math.min(500*2**attempt++,8000));};}
    async function poll(){if(stopped)return;try{const update=await pollSession(code!,token,etag,controller.signal);if(stopped)return;etag=update.etag;if(update.state)accept(update.state);if(update.serverTime!==undefined&&Number.isFinite(update.serverTime))setOffset(update.serverTime-Date.now());setError('');setConnected(true);pollFailures=0;}catch(e){if(stopped)return;setConnected(false);setError((e as Error).message);pollFailures++;}if(!stopped)timeout=setTimeout(poll,Math.min(30000,(document.hidden?6000:2000)*2**Math.min(pollFailures,4)));}
    api('/health').then(h=>{if(!stopped){if(h.transport==='poll')void poll();else connect();}}).catch(()=>{if(!stopped)timeout=setTimeout(poll,2000);});
    const heartbeat=setInterval(()=>{if(ws?.readyState===WebSocket.OPEN&&Date.now()-lastSeen>12000)ws.close();},3000);
    const presence=()=>{if(!stopped)api(`/sessions/${code}/presence`,{},token).catch(()=>{});};presence();const presenceTimer=setInterval(presence,15000);
    return()=>{clearInterval(presenceTimer);stopped=true;controller.abort();clearTimeout(timeout);clearInterval(heartbeat);ws?.close();};
  },[code,token]);
  const action=useCallback(async(action:string,data:unknown={},id=uuid())=>{if(!code)throw new Error('Geen sessie geselecteerd.');const result=await api(`/sessions/${code}/action`,{id,action,data},token);if(result.state&&activeIdentity.current===`${code}:${token}`&&result.state.revision>=lastRevision.current){lastRevision.current=result.state.revision;setState(result.state);setOffset(result.state.serverTime-Date.now());setError('');}return result;},[code,token]);
  return {state,connected,error,offset,action};
}
export function useServerNow(offset:number,pausedAt:number|null=null){const [now,setNow]=useState(Date.now());useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id);},[]);return pausedAt??now+offset;}
