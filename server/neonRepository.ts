import {encodeSnapshot,decodeSnapshot,encodeSnapshotDelta} from './snapshotCodec.js';
import type {SnapshotRepository} from './cloud.js';
export type SnapshotSql=(strings:TemplateStringsArray,...values:any[])=>Promise<Record<string,any>[]>;

/** Check the shared version every time, but transfer the large column only on change. */
export function createNeonRepository(sql:SnapshotSql):SnapshotRepository{
 let initialized:Promise<void>|undefined;
 function ensure(initial:string){
  initialized??=(async()=>{
   await sql`CREATE TABLE IF NOT EXISTS finance_state (id integer PRIMARY KEY, version integer NOT NULL, state text NOT NULL)`;
   await sql`CREATE TABLE IF NOT EXISTS finance_state_deltas (version integer PRIMARY KEY, delta text NOT NULL)`;
   await sql`INSERT INTO finance_state VALUES (1,0,${encodeSnapshot(initial)}) ON CONFLICT (id) DO NOTHING`;
  })().catch(error=>{initialized=undefined;throw error;});
  return initialized;
 }
 return {
  async load(initial,knownVersion){
   await ensure(initial);
   const known=knownVersion??-1;
   const rows=await sql`SELECT s.version,
    CASE WHEN s.version=${known} OR (s.version>${known} AND s.version-${known}=d.n AND d.bytes+d.n*48<octet_length(s.state)) THEN NULL ELSE s.state END AS state,
    CASE WHEN s.version>${known} AND s.version-${known}=d.n AND d.bytes+d.n*48<octet_length(s.state) THEN d.items ELSE NULL END AS deltas
    FROM finance_state s CROSS JOIN LATERAL (
     SELECT COUNT(*)::integer AS n,COALESCE(SUM(octet_length(delta)),0) AS bytes,json_agg(json_build_object('version',version,'delta',delta) ORDER BY version) AS items
     FROM finance_state_deltas WHERE version>${known} AND version<=s.version AND delta<>''
    ) d WHERE s.id=1`;
   const row=rows[0];if(!row)throw new Error('Missing finance snapshot');
   return {version:Number(row.version),...(row.state==null?{}:{state:decodeSnapshot(row.state)}),...(row.deltas?{deltas:row.deltas}: {})};
  },
  async save(version,state,previous){
   const removedSession=previous!==undefined&&(()=>{const before=JSON.parse(previous).sessions??[],after=new Set((JSON.parse(state).sessions??[]).map((row:{id:string})=>row.id));return before.some((row:{id:string})=>!after.has(row.id));})();
   // Deleted lobbies must disappear from the persisted change cache as well.
   const encoded=encodeSnapshotDelta(state,previous),delta=!removedSession&&encoded.startsWith('p1:')&&Buffer.byteLength(encoded)<=65536?encoded:'';
   // One atomic statement: a failed compare-and-swap writes neither the full state nor its delta.
   const rows=await sql`WITH updated AS (
    UPDATE finance_state SET state=${encodeSnapshot(state)},version=version+1 WHERE id=1 AND version=${version} RETURNING version
   ), logged AS (
    INSERT INTO finance_state_deltas (version,delta) SELECT version,${delta} FROM updated RETURNING version
   ), pruned AS (
    DELETE FROM finance_state_deltas WHERE version<=(SELECT version-${removedSession?1:64} FROM updated)
   ) SELECT version FROM logged`;
   return rows.length===1;
  },
 };
}
