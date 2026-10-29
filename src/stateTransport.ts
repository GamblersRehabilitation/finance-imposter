export type StatePatch={type:'patch';sessionId:string;baseRevision:number;changes:Record<string,unknown>;removed:string[]};
/** Views have already passed the role-specific server projection. Replace only changed root fields. */
export function stateUpdate(previous:any,next:any):{type:'state';state:any}|StatePatch{
 const full={type:'state' as const,state:next};
 if(!previous||previous.id!==next.id)return full;
 const changes:Record<string,unknown>={},removed=Object.keys(previous).filter(key=>!Object.hasOwn(next,key));
 for(const key of Object.keys(next))if(JSON.stringify(previous[key])!==JSON.stringify(next[key]))changes[key]=next[key];
 const patch:StatePatch={type:'patch',sessionId:next.id,baseRevision:previous.revision,changes,removed};
 return JSON.stringify(patch).length<JSON.stringify(full).length?patch:full;
}
export function applyStatePatch(previous:any,patch:StatePatch):any|null{
 if(!previous||previous.id!==patch.sessionId||previous.revision!==patch.baseRevision||!patch.changes||!Array.isArray(patch.removed))return null;
 const next={...previous,...patch.changes};for(const key of patch.removed)delete next[key];return next;
}
