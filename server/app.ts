import express, { type Request, type Response, type NextFunction } from 'express';
import { createServer } from 'node:http';
import { createHash, timingSafeEqual, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { handleUpload } from '@vercel/blob/client';
import { WebSocketServer, WebSocket } from 'ws';
import { z } from 'zod';
import { Engine } from './engine.js';
import { Store } from './store.js';
import { GameError, type Identity } from './types.js';
import { project } from './views.js';
export function createApp(options:{databasePath:string;adminPassword:string;clock?:()=>number;serveStatic?:boolean;secureCookie?:boolean;store?:Store;serverless?:boolean}) {
  if(options.adminPassword.length<12)throw new Error('ADMIN_PASSWORD moet minimaal 12 tekens bevatten.');
  const store=options.store??new Store(options.databasePath);const app=express();const server=createServer(app);
  const peers=new Map<WebSocket,{identity:Identity;code:string;token:string}>();
  const engine=new Engine(store,options.clock??Date.now,g=>{for(const [ws,peer] of peers){if(peer.identity.sessionId===g.id||peer.identity.actor.kind==='admin'&&peer.code===g.code)sendView(ws,peer);}});
  const wss=new WebSocketServer({server,path:'/ws',maxPayload:8192});
  app.disable('x-powered-by');app.use(express.json({limit:'16kb'}));
  app.use((_req,res,next)=>{res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');next();});
  function sameOrigin(req:Request|{headers:Record<string,any>}){const origin=req.headers.origin;if(!origin)return true;try{return new URL(origin).host===req.headers.host;}catch{return false;}}
  app.use((req,res,next)=>{if(req.method!=='GET'&&!sameOrigin(req)){res.status(403).json({error:'ORIGIN',message:'Onbekende herkomst.'});return;}next();});
  function limit(key:string,max:number){if(!store.rateLimit(key,max))throw new GameError('RATE_LIMIT','Te veel verzoeken. Probeer later opnieuw.',429);}
  const cookieToken=(req:Request|{headers:Record<string,any>})=>{const c=req.headers.cookie??'';const m=c.match(/(?:^|;\s*)fi_admin=([^;]+)/);return m?.[1];};
  function identity(req:Request){const bearer=req.headers.authorization?.match(/^Bearer ([A-Za-z0-9_-]+)$/)?.[1];const token=bearer??cookieToken(req);const i=token?store.identify(token):null;if(!i)throw new GameError('UNAUTHENTICATED','Meld je opnieuw aan.',401);return i;}
  function admin(req:Request){const i=identity(req);if(i.actor.kind!=='admin')throw new GameError('FORBIDDEN','Beheerderstoegang vereist.',403);return i;}
  function sessionIdentity(req:Request){const i=identity(req),g=engine.get(String(req.params.code));if(i.actor.kind!=='admin'&&i.sessionId!==g.id)throw new GameError('FORBIDDEN','Dit apparaat hoort bij een andere sessie.',403);return {i,g};}
  app.get('/api/health',(_req,res)=>res.json({ok:true,version:'0.2.0',transport:options.serverless?'poll':'ws'}));
  app.post('/api/admin/login',(req,res)=>{limit(`login:${req.ip}`,10);const password=z.string().max(256).parse(req.body.password);const digest=(s:string)=>createHash('sha256').update(s).digest();if(!timingSafeEqual(digest(password),digest(options.adminPassword)))throw new GameError('LOGIN','Onjuist beheerderswachtwoord.',401);const token=store.issue({kind:'admin'},null,Date.now()+8*60*60*1000);res.cookie('fi_admin',token,{httpOnly:true,secure:!!options.secureCookie,sameSite:'strict',maxAge:8*60*60*1000,path:'/'});res.json({ok:true});});
  app.post('/api/admin/logout',(req,res)=>{const token=cookieToken(req);if(token)store.revoke(token);res.clearCookie('fi_admin');res.json({ok:true});});
  app.get('/api/admin/sessions',(req,res)=>{admin(req);res.json(store.all().map(g=>({code:g.code,title:g.title,phase:g.phase,createdAt:g.createdAt,players:g.players.length})));});
  app.post('/api/admin/sessions',(req,res)=>{admin(req);const g=engine.create(req.body.title);res.json({code:g.code});});
  app.post('/api/admin/sessions/:code/delete',(req,res)=>{
    admin(req);const g=engine.get(String(req.params.code));
    const body=z.object({confirmCode:z.string()}).strict().parse(req.body);
    if(body.confirmCode!==g.code)throw new GameError('CONFIRM','Typ de lobbycode om te verwijderen.',409);
    if(!['lobby','ended'].includes(g.phase))throw new GameError('ACTIVE','Beëindig eerst het lopende spel.',409);
    store.deleteSession(g.id);
    for(const [ws,peer] of peers)if(peer.identity.sessionId===g.id||peer.code===g.code){peers.delete(ws);ws.close(4001,'lobby deleted');}
    res.json({ok:true});
  });
  app.get('/api/join/:code',(req,res)=>{limit(`join-read:${req.ip}`,120);const g=engine.get(String(req.params.code));res.json({code:g.code,title:g.title,phase:g.phase,registrationOpen:g.phase==='lobby',players:g.phase!=='ended'?g.players.filter(p=>!p.claimed).map(p=>({id:p.id,name:p.name})):[]});});
  app.post('/api/join/:code',(req,res)=>{limit(`join:${req.ip}`,40);const body=z.object({name:z.string().max(24).optional(),playerId:z.string().uuid().optional()}).strict().parse(req.body);res.json(engine.claim(String(req.params.code),body));});
  app.get('/api/sessions/:code',(req,res)=>{const {i,g}=sessionIdentity(req);res.json(project(g,i.actor,engine.now()));});
  app.post('/api/sessions/:code/presence',(req,res)=>{const {i,g}=sessionIdentity(req);engine.touch(g.code,i.actor);res.json({ok:true});});
  app.post('/api/sessions/:code/action',(req,res)=>{const {i}=sessionIdentity(req);limit(`action:${i.actor.kind}:${i.sessionId}:${req.ip}`,300);const body=z.object({id:z.string().uuid(),action:z.string().max(40),data:z.record(z.unknown()).optional()}).strict().parse(req.body);const result=engine.command(String(req.params.code),i.actor,body.id,body.action,body.data);res.json({...result,state:project(engine.get(String(req.params.code)),i.actor,engine.now())});});
  app.post('/api/sessions/:code/video-upload',async(req,res)=>{
    admin(req);const g=engine.get(String(req.params.code));
    if(g.phase!=='lobby')throw new GameError('PHASE','Upload de briefing vóór de start.',409);
    limit(`video:${g.id}`,10);
    const result=await handleUpload({request:req,body:req.body,onBeforeGenerateToken:async pathname=>{
      if(!new RegExp(`^briefings/${g.id}/[a-f0-9-]{36}\\.mp4$`).test(pathname))throw new GameError('VIDEO_PATH','Ongeldig videopad.',400);
      return {allowedContentTypes:['video/mp4'],maximumSizeInBytes:50*1024*1024,addRandomSuffix:true,validUntil:Date.now()+10*60*1000};
    }});res.json(result);
  });
  const uploads=resolve(options.databasePath===':memory:'?'data':resolve(options.databasePath,'..'),'uploads');
  app.post('/api/sessions/:code/video-file',express.raw({type:'application/octet-stream',limit:'50mb'}),(req,res)=>{
    admin(req);const g=engine.get(String(req.params.code));
    if(options.serverless)throw new GameError('VIDEO','Gebruik de online video-opslag.',400);
    if(g.phase!=='lobby')throw new GameError('PHASE','Upload de briefing vóór de start.',409);
    if(!Buffer.isBuffer(req.body)||req.body.length<12||req.body.toString('ascii',4,8)!=='ftyp')throw new GameError('VIDEO','Kies een geldig MP4-bestand.',400);
    limit(`video:${g.id}`,10);const id=randomUUID();mkdirSync(uploads,{recursive:true});writeFileSync(resolve(uploads,`${id}.mp4`),req.body);
    res.json({url:`/api/videos/${id}`});
  });
  app.get('/api/videos/:id',(req,res)=>{
    if(options.serverless||!z.string().uuid().safeParse(req.params.id).success)throw new GameError('NOT_FOUND','Video niet gevonden.',404);
    const file=resolve(uploads,`${req.params.id}.mp4`);if(!existsSync(file))throw new GameError('NOT_FOUND','Video niet gevonden.',404);
    res.type('video/mp4').sendFile(file);
  });
  app.post('/api/sessions/:code/device',(req,res)=>{admin(req);const g=engine.get(String(req.params.code));const body=z.object({kind:z.enum(['board','emergency','laptop']),laptopId:z.number().int().min(1).max(8).optional()}).strict().parse(req.body);if(body.kind==='laptop'&&!body.laptopId)throw new GameError('LAPTOP','Kies een laptop.');const token=store.issue({kind:body.kind,...(body.kind==='laptop'?{laptopId:body.laptopId}: {})},g.id);res.json({token});});
  const dist=resolve(process.cwd(),'dist');if(options.serveStatic!==false&&existsSync(dist)){app.use(express.static(dist,{index:false}));app.get('/{*path}',(_req,res)=>res.sendFile(resolve(dist,'index.html')));}
  app.use((error:unknown,_req:Request,res:Response,_next:NextFunction)=>{if(error instanceof GameError){res.status(error.status).json({error:error.code,message:error.message});}else if(error instanceof z.ZodError){res.status(400).json({error:'VALIDATION',message:'Controleer de ingevoerde waarden.',issues:error.issues.map(i=>({path:i.path,message:i.message}))});}else{console.error('Request error:',error instanceof Error?error.message:'unknown');res.status(500).json({error:'SERVER',message:'De server kon dit verzoek niet verwerken.'});}});
  function authorized(peer:{identity:Identity;code:string;token:string}){if(!store.identify(peer.token))return false;if(peer.identity.expiresAt && peer.identity.expiresAt<Date.now())return false;const g=engine.get(peer.code);return peer.identity.actor.kind==='admin'||peer.identity.sessionId===g.id;}
  function sendView(ws:WebSocket,peer:{identity:Identity;code:string;token:string}){try {if(!authorized(peer)){ws.close(4001,'expired');return;}const g=engine.get(peer.code);const view=project(g,peer.identity.actor,engine.now());if(!view){ws.close(4001,'player removed');return;}if(ws.readyState===WebSocket.OPEN){if(ws.bufferedAmount>1000000){ws.close(4008,'slow');return;}ws.send(JSON.stringify({type:'state',state:view}));}}catch{ws.close(4001,'invalid');}}
  wss.on('connection',(ws,req)=>{if(!sameOrigin(req)){ws.close(4003,'origin');return;}let n=0,authenticated=false;const timeout=setTimeout(()=>ws.close(4001,'auth required'),5000);ws.on('error',()=>{});
    ws.on('message',raw=>{try {if(authenticated||++n>2){ws.close(4003,'auth only');return;}const body=z.object({type:z.literal('auth'),code:z.string().regex(/^\d{6}$/),token:z.string().max(128).optional()}).strict().parse(JSON.parse(raw.toString()));const token=body.token??cookieToken(req);const i=token?store.identify(token):null;if(!i)throw new Error('auth');const g=engine.get(body.code);if(i.actor.kind!=='admin'&&i.sessionId!==g.id)throw new Error('session');authenticated=true;clearTimeout(timeout);const peer={identity:i,code:g.code,token:token!};peers.set(ws,peer);sendView(ws,peer);}catch{ws.close(4001,'invalid auth');}});
    ws.on('close',()=>{clearTimeout(timeout);peers.delete(ws);});});
  const tickTimer=setInterval(()=>{engine.tick();},100);
  const timeTimer=setInterval(()=>{for(const [ws,p] of peers){if(!authorized(p)){ws.close(4001,'expired');continue;}if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:'clock',serverTime:engine.now()}));}},1000);
  const maintenance=setInterval(()=>{for(const ws of wss.clients){if(ws.readyState===WebSocket.OPEN)ws.ping();}},30000);
  if(options.serverless){clearInterval(tickTimer);clearInterval(timeTimer);clearInterval(maintenance);}
  function close(){clearInterval(tickTimer);clearInterval(timeTimer);clearInterval(maintenance);for(const ws of wss.clients)ws.terminate();wss.close();server.close();store.close();}
  return {app,server,engine,store,wss,close};
}
