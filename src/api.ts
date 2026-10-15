import { useCallback, useEffect, useRef, useState } from 'react';
// getRandomValues also works on HTTP LAN addresses; randomUUID needs a secure context.
export function uuid(){const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const s=Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20)}`;}
export async function copyText(text:string){if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(text);return;}catch{}}const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();document.execCommand('copy');area.remove();}
export async function api(path:string, body?:unknown, token?:string|null) {
  const res=await fetch(`/api${path}`,{method:body===undefined?'GET':'POST',credentials:'same-origin',headers:{...(body!==undefined?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const data=await res.json();if(!res.ok)throw new Error(data.message??'Verzoek mislukt.');return data;
}
export function useGame(code:string|null,token:string|null=null) {
  const [state,setState]=useState<any>(null),[connected,setConnected]=useState(false),[error,setError]=useState(''),[offset,setOffset]=useState(0);
  const lastRevision=useRef(-1);
  useEffect(()=>{if(!code)return;let stopped=false,lastSeen=Date.now(),ws:WebSocket,timeout:ReturnType<typeof setTimeout>,attempt=0;setState(null);lastRevision.current=-1;
    const accept=(s:any)=>{if(s.revision>=lastRevision.current){setState(s);lastRevision.current=s.revision;setOffset(s.serverTime-Date.now());setError('');}};
    api(`/sessions/${code}`,undefined,token).then(accept).catch(e=>setError(e.message));
    function connect(){if(stopped)return;ws=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws`);ws.onopen=()=>ws.send(JSON.stringify({type:'auth',code, ...(token?{token}:{})}));ws.onmessage=e=>{lastSeen=Date.now();try{const msg=JSON.parse(e.data);if(msg.type==='state'){accept(msg.state);setConnected(true);attempt=0;}if(msg.type==='clock')setOffset(msg.serverTime-Date.now());}catch{}};ws.onerror=()=>setConnected(false);ws.onclose=e=>{setConnected(false);if(stopped)return;if(e.code===4001){setError('Koppeling verlopen. Open je herstellink of meld opnieuw aan.');return;}timeout=setTimeout(connect,Math.min(500*2**attempt++,8000));};}
    async function poll(){if(stopped)return;try{const s=await api(`/sessions/${code}`,undefined,token);if(stopped)return;accept(s);setConnected(true);}catch(e){if(stopped)return;setConnected(false);setError((e as Error).message);}if(!stopped)timeout=setTimeout(poll,document.hidden?6000:2000);}
    api('/health').then(h=>{if(!stopped){if(h.transport==='poll')void poll();else connect();}}).catch(()=>{if(!stopped)timeout=setTimeout(poll,2000);});
    const heartbeat=setInterval(()=>{if(ws?.readyState===WebSocket.OPEN&&Date.now()-lastSeen>12000)ws.close();},3000);
    const presence=()=>{if(!stopped)api(`/sessions/${code}/presence`,{},token).catch(()=>{});};presence();const presenceTimer=setInterval(presence,15000);
    return()=>{clearInterval(presenceTimer);stopped=true;clearTimeout(timeout);clearInterval(heartbeat);ws?.close();};
  },[code,token]);
  const action=useCallback(async(action:string,data:unknown={},id=uuid())=>{if(!code)throw new Error('Geen sessie geselecteerd.');const result=await api(`/sessions/${code}/action`,{id,action,data},token);return result;},[code,token]);
  return {state,connected,error,offset,action};
}
export function useServerNow(offset:number,pausedAt:number|null=null){const [now,setNow]=useState(Date.now());useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),100);return()=>clearInterval(id);},[]);return pausedAt??now+offset;}
