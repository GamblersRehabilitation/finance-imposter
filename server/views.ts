import {taskProgressKey,TASK_PARTS} from './taskStages.js';
import type { Actor, Game } from './types.js';
/** This is the only serialization boundary used by REST and WebSockets. Never spread Game into a non-admin view. */
export function project(g:Game,a:Actor,now=Date.now()) {
  if(a.kind==='admin') return {...g,serverTime:now,possibleIncome:g.config.startCapital+Object.values(g.assignments).flat().reduce((n,id)=>n+g.tasks.find(t=>t.id===id)!.reward,0)};
  const cashGoal=g.config.companyGoal;
  const publicPlayers=g.players.map(p=>({id:p.id,name:p.name,dismissed:p.dismissed,publicRole:p.dismissed ? p.role : p.role==='manager' ? 'manager' : null}));
  const red=g.thefts.filter(t=>t.debited&&!t.redCleared&&now<t.debitAt+8000).reduce((sum,t)=>sum+t.amount,0)+g.taskFailures.filter(f=>f.loss&&!f.redCleared&&now-f.at<8000).reduce((sum,f)=>sum+(f.loss??0),0);
  const common={id:g.id,code:g.code,title:g.title,revision:g.revision,phase:g.phase,serverTime:now,pausedAt:g.pausedAt,
    company:{balance:g.companyCash,goal:cashGoal,remaining:Math.max(0,cashGoal-g.companyCash)},companyProgress:Math.min(1,g.companyCash/cashGoal),reservedProgress:Math.min(1,red/cashGoal),meeting:g.meeting,round:g.round,
    nextMeetingAt:g.nextMeetingAt,cooldownUntil:g.cooldownUntil,
    durations:{auto:g.config.autoMeetingMs,gather:g.config.gatherMs,discuss:g.config.discussMs,cooldown:g.config.cooldownMs},
    lastDismissal:g.lastDismissal,winner:g.winner,endReason:g.endReason,
    tasks:g.tasks.map(t=>({id:t.id,icon:t.icon,module:t.module,label:t.label})),
    summary:g.phase==='ended'?g.summary:null,
  };
  if(a.kind==='board'||a.kind==='emergency')return {...common,...(a.kind==='board'&&g.phase==='lobby'?{lobby:{players:g.players.map(p=>({id:p.id,name:p.name,admitted:p.admitted})),joined:g.players.length,admitted:g.players.filter(p=>p.admitted).length}}:{}),device:a.kind,...(a.kind==='board'?{introVideoUrl:g.config.introVideoUrl}:{})};
  if(a.kind==='laptop'){
    const attempt=g.terminalAttempts.find(t=>t.laptopId===a.laptopId&&t.expiresAt>(g.pausedAt??now)&&t.round===g.round);
    const player=attempt?g.players.find(p=>p.id===attempt.playerId):null;
    return {...common,lastTerminalFailure:g.taskFailures.some(f=>f.laptopId===a.laptopId&&f.reason==='timeout'&&now-f.at<8000)?{message:'Tijd verstreken. Koppel de taak opnieuw.'}:null,device:'laptop',laptopId:a.laptopId,laptopCode:g.laptopCodes[a.laptopId!],terminal:attempt&&!attempt.taskFinished&&(attempt.taskExpiresAt??attempt.expiresAt)>(g.pausedAt??now)?{id:attempt.id,stage:attempt.taskStage??0,stages:TASK_PARTS,challengeId:attempt.challengeId,expiresAt:attempt.taskExpiresAt??attempt.expiresAt,player:player?{name:player.name}:null,puzzle:{title:attempt.puzzle.title,expression:attempt.puzzle.expression,choices:attempt.puzzle.choices,kind:attempt.puzzle.kind,instruction:attempt.puzzle.instruction,facts:attempt.puzzle.facts,details:attempt.puzzle.details,review:attempt.puzzle.review,matching:attempt.puzzle.matching?{items:attempt.puzzle.matching.items,accounts:attempt.puzzle.matching.accounts}:undefined}}:null};
  }
  if(a.kind!=='player')return null;
  const p=g.players.find(p=>p.id===a.playerId);
  if(!p)return null;
  const myTasks=(g.assignments[p.id]??[]).map(id=>({...common.tasks.find(t=>t.id===id),partsDone:g.completions.some(c=>c.playerId===p.id&&c.laptopId===id)?TASK_PARTS:(g.taskProgress[taskProgressKey(p.id,id)]??0),partsTotal:TASK_PARTS,completed:g.completions.some(c=>c.playerId===p.id&&c.laptopId===id)}));
  const attempt=g.terminalAttempts.find(t=>t.playerId===p.id&&t.expiresAt>(g.pausedAt??now)&&t.round===g.round);
  const view:any={...common,device:'player',me:{id:p.id,name:p.name,role:p.admitted?p.role:null,dismissed:p.dismissed,introSeen:p.introSeen,admitted:p.admitted},players:publicPlayers,myTasks:p.admitted?myTasks:[],introVideoUrl:g.config.introVideoUrl,lastTaskFailure:g.taskFailures.filter(f=>f.playerId===p.id).at(-1)??null,jobs:g.jobs.filter(j=>j.playerId===p.id).map(j=>({id:j.id,jobId:j.jobId,startedAt:j.startedAt,checkedAt:j.checkedAt,finishedAt:j.finishedAt,stage:j.stage,...(['accepted','rejected'].includes(j.stage)?{reason:j.accepted?'Welkom bij je nieuwe baan. Je blijft toeschouwer van dit spel.':j.reason}:{})})),terminalAttempt:attempt?{id:attempt.id,stage:attempt.taskStage??0,stages:TASK_PARTS,laptopId:attempt.laptopId,kind:attempt.kind,expiresAt:attempt.expiresAt,theft:attempt.theft}:null};
  if(p.role==='gambler'&&!p.dismissed&&p.admitted){view.gambler={partners:g.players.filter(q=>q.role==='gambler'&&q.id!==p.id).map(q=>({name:q.name,dismissed:q.dismissed})),progress:g.config.gamblerGoal ? Math.min(1,g.gamblerCash/g.config.gamblerGoal):0,balance:g.gamblerCash,goal:g.config.gamblerGoal,remaining:Math.max(0,(g.config.gamblerGoal??0)-g.gamblerCash),moneyLaptops:g.config.moneyLaptops,unlocked:g.theftUnlocked,configured:g.config.theftAmount!==null,lastSpin:g.lastGambles[p.id]??null,pendingSpin:g.pendingSpin?{id:g.pendingSpin.id,startedAt:g.pendingSpin.startedAt,endsAt:g.pendingSpin.endsAt,stake:g.pendingSpin.stake,...(g.pendingSpin.playerId===p.id?{segment:g.pendingSpin.segment}:{})}:null};}
  if(p.role==='security'&&!p.dismissed){view.security={checks:p.checks,maxChecks:2,alerts:g.thefts.filter(t=>t.alerted).map(t=>({id:t.id,laptopId:t.laptopId,kind:'theft'})).concat(g.taskFailures.map(f=>({id:f.id,laptopId:f.laptopId,kind:'task'}))),investigations:g.investigations.filter(i=>i.playerId===p.id).map(i=>({id:i.id,laptopId:i.laptopId,at:i.at,transactionTimes:i.transactionTimes,failures:i.failures??[],round:i.round}))};}
  if(p.role==='gambler'&&g.phase==='ended'){view.personalWinner=g.winner==='gamblers';}
  return view;
}
