import type { IncomingMessage, ServerResponse } from 'node:http';
import { Store } from './store.js';
import { createApp } from './app.js';
import {decodeSnapshotDelta} from './snapshotCodec.js';

export interface SnapshotRepository {
  // Omit state only when knownVersion matches. Every successful save increments version by one.
  load(initial:string,knownVersion?:number):Promise<{version:number;state?:string;deltas?:{version:number;delta:string}[]}>;
  save(version:number,state:string,previous?:string):Promise<boolean>;
}

/** Compare-and-swap commits the complete small classroom game atomically across Vercel instances.
 * A retry replays the request against fresh state. No response (including a new token) is sent before commit.
 * Local SQLite and cloud requests use exactly the same engine and authorization code. */
export function cloudHandler(repository:SnapshotRepository,adminPassword:string,seedCodes?:Record<number,string>,options:{clock?:()=>number}={}){
  let cached:{version:number;state:string}|undefined,initial:string|undefined;
  return async(req:IncomingMessage,res:ServerResponse)=>{
    if(req.method==='GET'&&req.url?.split('?')[0]==='/api/health'){
      res.statusCode=200;res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');res.setHeader('Content-Type','application/json');
      res.end(JSON.stringify({ok:true,version:'0.2.0',transport:'poll'}));return;
    }
    const originalEnd=res.end.bind(res),initialHeaders={...res.getHeaders()};
    try{
      for(let retry=0;retry<12;retry++){
        for(const name of res.getHeaderNames())res.removeHeader(name);
        for(const [name,value] of Object.entries(initialHeaders))if(value!==undefined)res.setHeader(name,value);
        res.statusCode=200;
        const store=new Store(':memory:');
        let runtime:ReturnType<typeof createApp>|undefined;
        try{
          if(initial===undefined){if(seedCodes){store.db.prepare('DELETE FROM laptop_codes').run();for(const [id,code] of Object.entries(seedCodes))store.db.prepare('INSERT INTO laptop_codes VALUES(?,?)').run(Number(id),code);}initial=store.snapshot();}
          const previous=cached;let loaded=await repository.load(initial,previous?.version);
          let state=loaded.state??(previous?.version===loaded.version?previous.state:undefined);
          if(state===undefined&&previous&&loaded.deltas){
            try{let version=previous.version;state=previous.state;for(const patch of loaded.deltas){if(patch.version!==++version)throw new Error('Snapshot delta gap');state=decodeSnapshotDelta(patch.delta,state);}if(version!==loaded.version)throw new Error('Incomplete snapshot delta chain');}
            catch{loaded=await repository.load(initial);state=loaded.state;}
          }
          if(state===undefined)throw new Error('Unvalidated snapshot cache');
          // Capture the matching immutable snapshot, even if another request updates the cache.
          cached={version:loaded.version,state};
          store.restore(state);
          runtime=createApp({databasePath:':memory:',store,adminPassword,secureCookie:true,serveStatic:false,serverless:true,clock:options.clock});
          const app=runtime;let chunk:any;
          await new Promise<void>((resolve,reject)=>{
            res.end=((data:any)=>{chunk=data;resolve();return res;}) as typeof res.end;
            app.engine.tick();
            app.app(req as any,res as any,(err?:unknown)=>{
              if(err)reject(err);else{res.statusCode=404;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({message:'Onbekende API-route.'}));}
            });
          });
          const next=store.snapshot();
          if(next===state||await repository.save(loaded.version,next,state)){
            if(next!==state)cached={version:loaded.version+1,state:next};
            res.end=originalEnd;originalEnd(chunk);return;
          }
        }finally{if(runtime)runtime.close();else store.close();}
        await new Promise(r=>setTimeout(r,10+Math.random()*40));
      }
      res.statusCode=503;res.setHeader('Content-Type','application/json');originalEnd(JSON.stringify({message:'Even druk. Probeer opnieuw.'}));
    }catch{
      // Never log database URLs, player tokens, or full persisted game state.
      res.statusCode=503;res.setHeader('Content-Type','application/json');originalEnd(JSON.stringify({message:'De online opslag is niet beschikbaar. Controleer de serverinstellingen.'}));
    }finally{res.end=originalEnd;}
  };
}
