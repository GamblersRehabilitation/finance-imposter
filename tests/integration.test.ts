import { beforeEach,afterEach,it,expect } from 'vitest';
import { WebSocket } from 'ws';
import { randomUUID } from 'node:crypto';
import { mkdtempSync,rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createApp } from '../server/app';
import type { Game } from '../server/types';
let runtime:ReturnType<typeof createApp>,base:string,dir:string,cookie:string;
const sockets:WebSocket[]=[];
async function req(path:string,body?:unknown,token?:string,admin=false){const res=await fetch(`${base}/api${path}`,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(token?{Authorization:`Bearer ${token}`} :{}),...(admin?{Cookie:cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:res.status,data:await res.json()};}
const act=(g:Game,action:string,data:any={},id=randomUUID())=>req(`/sessions/${g.code}/action`,{id,action,data},undefined,true);
async function setup(){const g=runtime.engine.create('Integratietest');await act(g,'demo');return runtime.engine.get(g.code);}
async function socket(g:Game,token?:string,admin=false):Promise<{ws:WebSocket;states:any[]}>{const ws=new WebSocket(`${base.replace('http','ws')}/ws`,admin?{headers:{Cookie:cookie}}:{});sockets.push(ws);const states:any[]=[];return new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('WebSocket timeout')),4000);ws.on('open',()=>ws.send(JSON.stringify({type:'auth',code:g.code,...(token?{token}:{})})));ws.on('message',m=>{const msg=JSON.parse(m.toString());if(msg.type==='state'){states.push(msg.state);clearTimeout(timeout);resolve({ws,states});}});ws.on('error',reject);});}
const eventually=async(fn:()=>boolean)=>{for(let i=0;i<100;i++){if(fn())return;await new Promise(r=>setTimeout(r,10));}throw new Error('Verwachte realtime update ontbreekt.');};
beforeEach(async()=>{dir=mkdtempSync(join(tmpdir(),'finance-test-'));runtime=createApp({databasePath:join(dir,'test.sqlite'),adminPassword:'test-password-long',serveStatic:false});await new Promise<void>(r=>runtime.server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${(runtime.server.address() as any).port}`;const res=await fetch(`${base}/api/admin/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:'test-password-long'})});cookie=res.headers.get('set-cookie')!.split(';')[0];});
afterEach(()=>{sockets.splice(0).forEach(s=>s.terminate());runtime.close();rmSync(dir,{recursive:true,force:true});});
it('houdt 14 spelers en 10 extra apparaten realtime gesynchroniseerd zonder geheime data te lekken',async()=>{const g=await setup();const playerTokens=await Promise.all(g.players.map(async p=>{const r=await req(`/join/${g.code}`,{playerId:p.id});expect(r.status).toBe(200);return r.data.token;}));const players=await Promise.all(playerTokens.map(t=>socket(g,t)));const devices=await Promise.all(Array.from({length:10},async(_,i)=>{const kind=i<8?'laptop':i===8?'board':'emergency';const r=await req(`/sessions/${g.code}/device`,{kind,...(kind==='laptop'?{laptopId:i+1}:{})},undefined,true);expect(r.status).toBe(200);return {token:r.data.token,peer:await socket(g,r.data.token)};}));await act(g,'start');await eventually(()=>players.every(p=>p.states.at(-1)?.phase==='playing')&&devices.every(d=>d.peer.states.at(-1)?.phase==='playing'));
  const worker=g.players.find(p=>p.role==='employee')!,laptopId=g.assignments[worker.id][0],id=randomUUID();const results=await Promise.all([act(g,'test-task',{playerId:worker.id,laptopId},id),act(g,'test-task',{playerId:worker.id,laptopId},id)]);expect(results.map(r=>r.status)).toEqual([200,200]);await eventually(()=>players.every(p=>p.states.at(-1)?.companyProgress===.13)&&devices.every(d=>d.peer.states.at(-1)?.companyProgress===.13));
  for(let i=0;i<g.players.length;i++){const view=players[i].states.at(-1);expect(view).not.toHaveProperty('config');if(g.players[i].role!=='gambler')expect(view).not.toHaveProperty('gambler');view.players.forEach((p:any)=>expect(p.publicRole).toBe(p.id===g.players.find(q=>q.role==='manager')!.id?'manager':null));}
  const emergency=devices[9];const r=await req(`/sessions/${g.code}/action`,{id:randomUUID(),action:'request-meeting',data:{}},emergency.token);expect(r.status).toBe(200);await eventually(()=>players.every(p=>p.states.at(-1)?.meeting.phase==='gathering')&&devices.every(d=>d.peer.states.at(-1)?.meeting.phase==='gathering'));
});
it('weigert onbevoegde REST-acties en verkeerde sessietokens',async()=>{const g=await setup();const worker=g.players.find(p=>p.role==='employee')!;const token=(await req(`/join/${g.code}`,{playerId:worker.id})).data.token;await act(g,'start');for(const action of ['steal','investigate','dismiss','test-theft','test-task','test-cash','test-mode']){const r=await req(`/sessions/${g.code}/action`,{id:randomUUID(),action,data:{laptopId:2,playerId:worker.id,amount:1,enabled:true}},token);expect(r.status).toBe(403);}expect((await req('/admin/sessions',undefined,token)).status).toBe(403);expect((await req(`/sessions/${g.code}`)).status).toBe(401);const other=runtime.engine.create();expect((await req(`/sessions/${other.code}`,undefined,token)).status).toBe(403);const task=await req(`/sessions/${g.code}/action`,{id:randomUUID(),action:'task-proof',data:{laptopId:g.assignments[worker.id][0],proof:{success:true}}},token);expect(task.status).toBe(409);});
it('herstel trekt het vorige token in, zowel REST als actieve WebSocket',async()=>{const g=await setup();const worker=g.players.find(p=>p.role==='employee')!;const token=(await req(`/join/${g.code}`,{playerId:worker.id})).data.token;const {ws}=await socket(g,token);const closed=new Promise<void>(r=>ws.once('close',()=>r()));const recovery=await act(g,'recover-player',{playerId:worker.id});await closed;expect((await req(`/sessions/${g.code}`,undefined,token)).status).toBe(401);expect((await req(`/sessions/${g.code}`,undefined,recovery.data.token)).status).toBe(200);});
it('bewaart status, credentials, open diefstal en idempotentie na serverherstart',async()=>{let now=100000;runtime.engine.now=()=>now;const g=await setup();const gambler=g.players.find(p=>p.role==='gambler')!;const token=(await req(`/join/${g.code}`,{playerId:gambler.id})).data.token;await act(g,'start');await act(g,'test-cash',{amount:25});const id=randomUUID(),data={playerId:gambler.id,laptopId:2,amount:7};await act(g,'test-theft',data,id);runtime.close();now+=6000;runtime=createApp({databasePath:join(dir,'test.sqlite'),adminPassword:'test-password-long',clock:()=>now,serveStatic:false});runtime.engine.tick();await new Promise<void>(r=>runtime.server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${(runtime.server.address() as any).port}`;const view=await req(`/sessions/${g.code}`,undefined,token);expect(view.status).toBe(200);expect(view.data.companyProgress).toBe(.18);const replay=await act(g,'test-theft',data,id);expect(replay.status).toBe(200);expect(runtime.engine.get(g.code).gamblerCash).toBe(7);const peer=await socket(g,token);expect(peer.states[0].gambler.progress).toBeCloseTo(7/30);now+=4000;runtime.engine.tick();expect(runtime.engine.get(g.code).thefts[0].alerted).toBe(true);});
it('een nog vrije vooraf geregistreerde naam kan ook na start aansluiten, nieuwe registratie niet',async()=>{const g=await setup();await act(g,'start');const r=await req(`/join/${g.code}`,{playerId:g.players[0].id});expect(r.status).toBe(200);expect((await req(`/sessions/${g.code}`,undefined,r.data.token)).data.me.id).toBe(g.players[0].id);expect((await req(`/join/${g.code}`,{name:'Extra speler'})).status).toBe(409);const list=await req(`/join/${g.code}`);expect(list.data.registrationOpen).toBe(false);expect(list.data.players).toHaveLength(13);});
it('player refresh en reconnect behouden identiteit en voortgang',async()=>{const g=await setup();const player=g.players[0];const token=(await req(`/join/${g.code}`,{playerId:player.id})).data.token;const first=await socket(g,token);first.ws.close();await act(g,'start');const second=await socket(g,token);expect(second.states[0].me.id).toBe(player.id);expect(second.states[0].phase).toBe('playing');expect((await req(`/join/${g.code}`,{playerId:player.id})).status).toBe(409);});
it('koppelt telefoon en terminal realtime, bewaart de poging na herstart en betaalt eenmaal',async()=>{
  const g=await setup(),worker=g.players.find(p=>p.role==='employee')!,laptopId=g.assignments[worker.id][0];
  const token=(await req(`/join/${g.code}`,{playerId:worker.id})).data.token;
  const deviceToken=(await req(`/sessions/${g.code}/device`,{kind:'laptop',laptopId},undefined,true)).data.token;
  const phone=await socket(g,token),terminal=await socket(g,deviceToken);await act(g,'start');
  const codes=runtime.engine.get(g.code).laptopCodes;
  const begin=await req(`/sessions/${g.code}/action`,{id:randomUUID(),action:'terminal-begin',data:{kind:'task',laptopId,code:codes[laptopId]}},token);
  expect(begin.status).toBe(200);await eventually(()=>!!terminal.states.at(-1)?.terminal&&!!phone.states.at(-1)?.terminalAttempt);
  expect(terminal.states.at(-1).terminal.player.name).toBe(worker.name);
  expect(phone.states.at(-1).terminalAttempt).not.toHaveProperty('challenge');
  const answer=runtime.engine.get(g.code).terminalAttempts[0].puzzle.answer,attemptId=begin.data.attemptId;
  runtime.close();runtime=createApp({databasePath:join(dir,'test.sqlite'),adminPassword:'test-password-long',serveStatic:false});
  await new Promise<void>(r=>runtime.server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${(runtime.server.address() as any).port}`;
  expect(runtime.engine.get(g.code).laptopCodes).toEqual(codes);
  expect(runtime.engine.create().laptopCodes).toEqual(codes);
  const reconnected=await socket(g,token);expect(reconnected.states[0].terminalAttempt.id).toBe(attemptId);
  const id=randomUUID(),body={id,action:'terminal-confirm',data:{attemptId,answer}};
  const results=await Promise.all([req(`/sessions/${g.code}/action`,body,deviceToken),req(`/sessions/${g.code}/action`,body,deviceToken)]);
  expect(results.map(r=>r.status)).toEqual([200,200]);expect(runtime.engine.get(g.code).companyCash).toBe(13);
  expect((await req(`/sessions/${g.code}/action`,{...body,id:randomUUID()},deviceToken)).status).toBe(409);
  const restoredTerminal=await socket(g,deviceToken);expect(restoredTerminal.states[0].terminal).toBeNull();expect(restoredTerminal.states[0].laptopCode).toBe(codes[laptopId]);
});
it('accepteert dezelfde herkomst via de Vite-proxy en weigert vreemde herkomsten',async()=>{
  // Start the actual configured development proxy, targeting this test's server.
  const {createServer}=await import('vite');const config=(await import('../vite.config')).default as any;
  const dev=await createServer({configFile:false,server:{...config.server,host:'127.0.0.1',port:0,proxy:{'/api':{...config.server.proxy['/api'],target:base}}}});
  await dev.listen();try{
    const url=`http://127.0.0.1:${(dev.httpServer!.address() as any).port}`;
    const login=(origin:string)=>fetch(`${url}/api/admin/login`,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({password:'test-password-long'})});
    expect((await login(url)).status).toBe(200);expect((await login('https://unknown.example')).status).toBe(403);
  }finally{await dev.close();}
});
