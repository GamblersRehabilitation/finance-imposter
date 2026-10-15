import type { IncomingMessage, ServerResponse } from 'node:http';
import { Store } from './store.js';
import { createApp } from './app.js';

export interface SnapshotRepository {
  load(initial:string):Promise<{version:number;state:string}>;
  save(version:number,state:string):Promise<boolean>;
}

/** Compare-and-swap commits the complete small classroom game atomically across Vercel instances.
 * A retry replays the request against fresh state. No response (including a new token) is sent before commit.
 * Local SQLite and cloud requests use exactly the same engine and authorization code. */
export function cloudHandler(repository:SnapshotRepository,adminPassword:string,seedCodes?:Record<number,string>){
  return async(req:IncomingMessage,res:ServerResponse)=>{
    const originalEnd=res.end.bind(res),initialHeaders={...res.getHeaders()};
    try{
      for(let retry=0;retry<12;retry++){
        for(const name of res.getHeaderNames())res.removeHeader(name);
        for(const [name,value] of Object.entries(initialHeaders))if(value!==undefined)res.setHeader(name,value);
        res.statusCode=200;
        const store=new Store(':memory:');
        if(seedCodes){store.db.prepare('DELETE FROM laptop_codes').run();for(const [id,code] of Object.entries(seedCodes))store.db.prepare('INSERT INTO laptop_codes VALUES(?,?)').run(Number(id),code);}
        const loaded=await repository.load(store.snapshot());store.restore(loaded.state);
        const runtime=createApp({databasePath:':memory:',store,adminPassword,secureCookie:true,serveStatic:false,serverless:true});
        let chunk:any;
        try{
          await new Promise<void>((resolve,reject)=>{
            res.end=((data:any)=>{chunk=data;resolve();return res;}) as typeof res.end;
            runtime.engine.tick();
            runtime.app(req as any,res as any,(err?:unknown)=>{
              if(err)reject(err);else{res.statusCode=404;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({message:'Onbekende API-route.'}));}
            });
          });
          const next=store.snapshot();
          if(next===loaded.state||await repository.save(loaded.version,next)){
            res.end=originalEnd;originalEnd(chunk);return;
          }
        }finally{runtime.close();}
        await new Promise(r=>setTimeout(r,10+Math.random()*40));
      }
      res.statusCode=503;res.setHeader('Content-Type','application/json');originalEnd(JSON.stringify({message:'Even druk. Probeer opnieuw.'}));
    }catch{
      // Never log database URLs, player tokens, or full persisted game state.
      res.statusCode=503;res.setHeader('Content-Type','application/json');originalEnd(JSON.stringify({message:'De online opslag is niet beschikbaar. Controleer de serverinstellingen.'}));
    }finally{res.end=originalEnd;}
  };
}
