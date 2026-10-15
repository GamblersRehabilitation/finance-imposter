import { neon } from '@neondatabase/serverless';
import { cloudHandler, type SnapshotRepository } from '../server/cloud.js';
import { z } from 'zod';

export const config={maxDuration:30};
let handler:ReturnType<typeof cloudHandler>|undefined;
export default async function api(req:any,res:any){
  const route=req.query?.route??new URL(req.url,'https://local.invalid').searchParams.get('route');
  if(route)req.url='/api/'+(Array.isArray(route)?route.join('/'):route);
  if(!process.env.DATABASE_URL||!process.env.ADMIN_PASSWORD){res.statusCode=503;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({message:'Koppel een Neon-database en stel ADMIN_PASSWORD in bij Vercel.'}));return;}
  if(!handler){
    const sql=neon(process.env.DATABASE_URL);
    let initialized:Promise<any>|undefined;
    const repository:SnapshotRepository={
      async load(initial){
        initialized??=sql`CREATE TABLE IF NOT EXISTS finance_state (id integer PRIMARY KEY, version integer NOT NULL, state text NOT NULL)`;
        await initialized;
        await sql`INSERT INTO finance_state VALUES (1,0,${initial}) ON CONFLICT (id) DO NOTHING`;
        const rows=await sql`SELECT version,state FROM finance_state WHERE id=1`;return rows[0] as {version:number;state:string};
      },
      async save(version,state){const rows=await sql`UPDATE finance_state SET state=${state},version=version+1 WHERE id=1 AND version=${version} RETURNING version`;return rows.length===1;},
    };
    const codes=process.env.LAPTOP_CODES_JSON?z.record(z.string().regex(/^[0-5]{4}$/)).refine(c=>Object.keys(c).sort().join(',')==='1,2,3,4,5,6,7,8'&&new Set(Object.values(c)).size===8).parse(JSON.parse(process.env.LAPTOP_CODES_JSON)):undefined;
    handler=cloudHandler(repository,process.env.ADMIN_PASSWORD,codes);
  }
  return handler(req,res);
}
