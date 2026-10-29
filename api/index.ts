import { neon } from '@neondatabase/serverless';
import { cloudHandler } from '../server/cloud.js';
import { z } from 'zod';
import {createNeonRepository} from '../server/neonRepository.js';

export const config={maxDuration:30};
let handler:ReturnType<typeof cloudHandler>|undefined;
export default async function api(req:any,res:any){
  const route=req.query?.route??new URL(req.url,'https://local.invalid').searchParams.get('route');
  if(route)req.url='/api/'+(Array.isArray(route)?route.join('/'):route);
  if(!process.env.DATABASE_URL||!process.env.ADMIN_PASSWORD){res.statusCode=503;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({message:'Koppel een Neon-database en stel ADMIN_PASSWORD in bij Vercel.'}));return;}
  if(!handler){
    const sql=neon(process.env.DATABASE_URL);
    const repository=createNeonRepository(sql);
    const codes=process.env.LAPTOP_CODES_JSON?z.record(z.string().regex(/^[0-5]{4}$/)).refine(c=>Object.keys(c).sort().join(',')==='1,2,3,4,5,6,7,8'&&new Set(Object.values(c)).size===8).parse(JSON.parse(process.env.LAPTOP_CODES_JSON)):undefined;
    handler=cloudHandler(repository,process.env.ADMIN_PASSWORD,codes);
  }
  return handler(req,res);
}
