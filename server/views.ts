import type { Actor, Game } from './types.js';
/** This is the only serialization boundary used by REST and WebSockets. Never spread Game into a non-admin view. */
export function project(g:Game,a:Actor,now=Date.now()) {
  if(a.kind==='admin') return {...g,serverTime:now,possibleIncome:g.config.startCapital+Object.values(g.assignments).flat().reduce((n,id)=>n+g.tasks.find(t=>t.id===id)!.reward,0)};
  const cashGoal=g.config.companyGoal;
  const publicPlayers=g.players.map(p=>({id:p.id,name:p.name,dismissed:p.dismissed,publicRole:p.dismissed ? p.role : p.role==='manager' ? 'manager' : null}));
  const red=g.thefts.filter(t=>!t.debited).reduce((sum,t)=>sum+t.amount,0);
  const common={id:g.id,code:g.code,title:g.title,revision:g.revision,phase:g.phase,serverTime:now,pausedAt:g.pausedAt,
    companyProgress:Math.min(1,g.companyCash/cashGoal),reservedProgress:Math.min(1,red/cashGoal),meeting:g.meeting,round:g.round,
    nextMeetingAt:g.nextMeetingAt,cooldownUntil:g.cooldownUntil,
    durations:{auto:g.config.autoMeetingMs,gather:g.config.gatherMs,discuss:g.config.discussMs,cooldown:g.config.cooldownMs},
    lastDismissal:g.lastDismissal,winner:g.winner,endReason:g.endReason,
    tasks:g.tasks.map(t=>({id:t.id,icon:t.icon,module:t.module})),
  };
  if(a.kind==='board'||a.kind==='emergency')return {...common,device:a.kind};
  if(a.kind==='laptop')return {...common,device:'laptop',laptopId:a.laptopId,players:publicPlayers};
  if(a.kind!=='player')return null;
  const p=g.players.find(p=>p.id===a.playerId);
  if(!p)return null;
  const myTasks=(g.assignments[p.id]??[]).map(id=>({...common.tasks.find(t=>t.id===id),completed:g.completions.some(c=>c.playerId===p.id&&c.laptopId===id)}));
  const view:any={...common,device:'player',me:{id:p.id,name:p.name,role:p.role,dismissed:p.dismissed,introSeen:p.introSeen},players:publicPlayers,myTasks,introVideoUrl:g.config.introVideoUrl};
  if(p.role==='gambler'&&!p.dismissed){view.gambler={partners:g.players.filter(q=>q.role==='gambler'&&q.id!==p.id).map(q=>({name:q.name,dismissed:q.dismissed})),progress:g.config.gamblerGoal ? Math.min(1,g.gamblerCash/g.config.gamblerGoal):0,moneyLaptops:g.config.moneyLaptops,unlocked:g.theftUnlocked};}
  if(p.role==='security'&&!p.dismissed){view.security={checks:p.checks,maxChecks:2,alerts:g.thefts.filter(t=>t.alerted).map(t=>({id:t.id,laptopId:t.laptopId})),investigations:g.investigations.filter(i=>i.playerId===p.id).map(i=>({id:i.id,laptopId:i.laptopId,at:i.at,transactionTimes:i.transactionTimes,round:i.round}))};}
  if(p.role==='gambler'&&g.phase==='ended'){view.personalWinner=g.winner==='gamblers'&&(g.config.dismissedGambler==='shares'||!p.dismissed);}
  return view;
}
