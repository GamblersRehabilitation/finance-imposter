import {cashAccess} from './cashAccess.js';
import {TASK_DURATION_MS,MAX_OPEN_TASKS} from '../src/taskRules.js';
import {drawAssignments} from './assignmentRules.js';
import { createHash, randomInt, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { GameError, type Game, type Role, type Actor, type Config } from './types.js';
import { Store } from './store.js';
import { taskAdapters } from './minigames.js';
import { wheelPayout, WHEEL } from '../src/wheelRules.js';
import {makeTheftState,refreshTheftChallenge} from './theftPuzzles.js';
import {angleDistance,lockAngle,tracePipes} from '../src/theftRules.js';
import {makeTaskStage,makeTaskSequence,drawTaskSequence,taskProgressKey,TASK_PARTS} from './taskStages.js';
import {economyFor,TASK_REWARD,taskFailureCost,theftThreshold,theftLimits,maxWheelStake,SPINS_PER_ROUND,shopCatalog,purchaseGoal} from '../src/economyRules.js';
import {defaultFloorPlan} from '../src/floorPlanRules.js';
import {floorPlanSchema} from './floorPlan.js';
import { financialTasks } from './puzzles.js';
const int = z.number().int().min(0).max(1000000000);
const positive = z.number().int().min(1).max(1000000000);
const roleSchema=z.enum(['manager','security','gambler','employee']);
const configSchema=z.object({
  playerCount:z.number().int().min(1).max(100000), roles:z.object({manager:int.max(1),security:int, gambler:int,employee:int}),
  startCapital:positive, companyGoal:positive, gamblerGoal:positive.nullable(), theftAmount:positive.nullable().default(null),
  autoMeetingMs:z.number().int().min(1000).max(3600000),gatherMs:z.number().int().min(1000).max(3600000),discussMs:z.number().int().min(1000).max(3600000),cooldownMs:z.number().int().min(1000).max(3600000),
  workerWin:z.enum(['dismiss','dismiss-and-finance']).nullable(),zeroCash:z.enum(['continue','draw']).nullable(),dismissedGambler:z.enum(['shares','excluded']).nullable(),
  moneyLaptops:z.array(z.number().int().min(1).max(8)).max(2).refine(a=>new Set(a).size===a.length),testMode:z.boolean(),
  autoEconomy:z.boolean().default(true),introVideoUrl:z.string().trim().max(2048).refine(s=>/^https?:\/\//.test(s)||/^\/(?!\/)/.test(s),'Gebruik een http(s)-URL of een pad zoals /briefing.mp4.').nullable()
}).strict();
const nameSchema=z.string().trim().min(1).max(24);
const need=(ok:unknown,code:string,message:string,status=400):void=>{if(!ok)throw new GameError(code,message,status);};
export function defaultConfig():Config {return {playerCount:14,roles:{manager:1,security:1,gambler:2,employee:10},...economyFor(14),autoEconomy:true,autoMeetingMs:240000,gatherMs:30000,discussMs:90000,cooldownMs:60000,workerWin:'dismiss',zeroCash:'draw',dismissedGambler:'shares',moneyLaptops:[2,5],testMode:false,introVideoUrl:null};}
const tasks = financialTasks;
export class Engine {
  assignmentRoll=(max:number)=>randomInt(max);
  roll=()=>randomInt(WHEEL.length);
  taskSequence=(first:number,deck?:import('../src/financeModes.js').FinanceDeck)=>deck?drawTaskSequence(deck):makeTaskSequence(first);
  jobRoll=()=>randomInt(100);
  theftRoll=()=>randomInt(2);
  constructor(public store:Store, public now:()=>number=Date.now, public changed:(g:Game)=>void=()=>{}){}
  get(code:string):Game {const g=this.store.get(code);if(!g)throw new GameError('NOT_FOUND','Deze sessie bestaat niet.',404);return g;}
  create(title='Nieuwe vestiging'):Game {
    title=nameSchema.parse(title);
    for(const old of this.store.all())if(old.phase==='ended')this.store.deleteSession(old.id);
    let code:string;do{code=randomInt(100000,1000000).toString();}while(this.store.get(code));
    const g:Game={economyVersion:1,financeVersion:1,rulesVersion:4,id:randomUUID(),code,title:nameSchema.parse(title),revision:0,createdAt:this.now(),phase:'lobby',pausedAt:null,config:defaultConfig(),players:[],tasks:tasks.slice(0,8).map(([icon,label],i)=>({id:i+1,icon,label,reward:TASK_REWARD,module:`finance-${i+1}`})),assignments:{},completions:[],floorPlan:this.store.floorPlan(),taskCycles:{},taskSequences:{},taskDecks:{},laptopCodes:this.store.laptopCodes(),terminalAttempts:[],taskProgress:{},companyCash:defaultConfig().startCapital,gamblerCash:0,spinsThisRound:{},purchases:[],theftUnlocked:false,thefts:[],investigations:[],ledger:[],meeting:{phase:'idle',source:null,startedAt:null,deadline:null,dismissedId:null},round:0,nextMeetingAt:null,cooldownUntil:null,lastDismissal:null,winner:null,endReason:null,pendingSpin:null,jobs:[],taskFailures:[],summary:null,presence:{},lastGambles:{}};
    this.store.save(g);return g;
  }
  ledger(g:Game,kind:string,amount:number,detail:string){g.ledger.push({id:randomUUID(),kind,amount,company:g.companyCash,gamblers:g.gamblerCash,at:this.now(),detail});}
  total(g:Game){return g.config.startCapital+g.players.length*g.tasks.reduce((n,t)=>n+t.reward,0);}
  wealth(g:Game){return g.gamblerCash+g.purchases.reduce((n,p)=>n+p.price,0);}
  addTasks(g:Game){for(const p of g.players){if(p.dismissed)continue;const unfinished=Array.from({length:8},(_,i)=>i+1).filter(id=>(g.taskProgress[taskProgressKey(p.id,id)]??0)>0);g.assignments[p.id]=drawAssignments(g.assignments[p.id]??[],this.assignmentRoll,unfinished);}}
  gameId(g:Game,laptopId:number){return g.floorPlan.laptops.find(l=>l.id===laptopId)?.gameId??laptopId;}
  rotateCash(g:Game){const count=g.config.moneyLaptops.length,available=Array.from({length:8},(_,i)=>i+1).filter(id=>!g.config.moneyLaptops.includes(id));for(let i=available.length-1;i>0;i--){const j=randomInt(i+1);[available[i],available[j]]=[available[j],available[i]];}g.config.moneyLaptops=available.slice(0,count);}

  active(g:Game){need(g.phase==='playing','NOT_ACTIVE','Het spel is niet actief.',409);}
  terminalReady(g:Game){this.active(g);need(g.meeting.phase==='idle','MEETING','Opdrachten zijn tijdens een meeting gepauzeerd.',409);}
  beginTerminal(g:Game,a:Actor,data:any){
    this.terminalReady(g);const p=this.player(g,a);
    const code=z.string().regex(/^[0-5]{4}$/).parse(data.code);
    const laptopId=Number(Object.keys(g.laptopCodes).find(id=>g.laptopCodes[Number(id)]===code));
    need(laptopId,'CODE','Verkeerde laptopcode.',403);need(p.admitted,'WAITING','Wacht op toelating.',403);
    const kind=z.enum(['task','theft']).parse(data.kind);
    if(kind==='task'){
      need(data.laptopId===laptopId,'CODE','Deze code hoort bij een andere taak.',403);
      need(g.assignments[p.id]?.includes(laptopId),g.completions.some(c=>c.playerId===p.id&&c.laptopId===laptopId)?'ALREADY_COMPLETED':'NOT_ASSIGNED','Deze taak is niet aan deze speler toegewezen.',403);

    }else{
      this.player(g,a,'gambler');need(g.theftUnlocked,'LOCKED','Diefstal is nog niet ontgrendeld.',409);
      need(g.config.moneyLaptops.includes(laptopId),'LOCATION','Deze laptop is niet verbonden met de kas.',403);
      need(g.config.theftAmount!==null,'THEFT_AMOUNT','De beheerder moet de buit instellen.',409);
      need(cashAccess(g,p.id).laptops.includes(laptopId),'CASH_USED','Deze kas is deze ronde al door jou gebruikt. Kies de andere kas of wacht op de meeting.',409);
    }
    g.terminalAttempts=g.terminalAttempts.filter(t=>t.expiresAt>this.now()&&t.round===g.round);
    const existing=g.terminalAttempts.find(t=>t.laptopId===laptopId);
    need(!existing||existing.playerId===p.id,'TERMINAL_BUSY','Deze terminal is bezet.',409);
    if(existing?.playerId===p.id&&existing.kind===kind)return {ok:true,attemptId:existing.id};
    g.terminalAttempts=g.terminalAttempts.filter(t=>t.playerId!==p.id);
    const taskStage=kind==='task'?(g.taskProgress[taskProgressKey(p.id,laptopId)]??0):0;
    const key=taskProgressKey(p.id,laptopId),sequence=kind==='task'?(g.taskSequences[key]??=(taskStage>0?[this.gameId(g,laptopId),13,14]:this.taskSequence(this.gameId(g,laptopId),g.taskDecks[p.id]??={remaining:[],last:[]}))):this.taskSequence(this.gameId(g,laptopId));
    const attempt:Game['terminalAttempts'][number]={sequence,taskStage,challengeId:randomUUID(),id:randomUUID(),playerId:p.id,laptopId,kind,round:g.round,expiresAt:this.now()+(kind==='task'?TASK_DURATION_MS:300000),taskDurationMs:TASK_DURATION_MS,taskExpiresAt:this.now()+TASK_DURATION_MS,puzzle:makeTaskStage(this.gameId(g,laptopId),taskStage,sequence)};
    // Opt in from the new visual interface; older clients keep their existing flow.
    if(data.visual===true){attempt.visualMode=true;this.prepareTaskTutorial(g,attempt);}
    if(kind==='theft')attempt.theft=makeTheftState(this.theftRoll()===0?'lockpick':'diversion',this.now());
    g.terminalAttempts.push(attempt);return {ok:true,attemptId:attempt.id};
  }
  prepareTaskTutorial(g:Game,t:Game['terminalAttempts'][number]){
    if(t.kind!=='task'||!t.visualMode)return;
    // Every new financial part starts with its own lesson, including previously learned games.
    t.practicePending=true;t.expiresAt=this.now()+300000;delete t.taskExpiresAt;
  }
  expireTask(g:Game,t:Game['terminalAttempts'][number],reason:'answer'|'timeout'='timeout'){
    if(t.practicePending){g.terminalAttempts=g.terminalAttempts.filter(x=>x.id!==t.id);return;}
    if(!g.taskFailures.some(f=>f.attemptId===t.id)){
      const reserved=g.thefts.filter(x=>!x.debited).reduce((sum,x)=>sum+x.amount,0),loss=Math.min(taskFailureCost(g.config.theftAmount,g.tasks.find(x=>x.id===t.laptopId)?.reward??TASK_REWARD),Math.max(0,g.companyCash-reserved));
      g.companyCash-=loss;g.taskFailures.push({id:randomUUID(),attemptId:t.id,laptopId:t.laptopId,playerId:t.playerId,reason,loss,at:this.now(),redCleared:false});
      this.ledger(g,'task-failed',-loss,`Laptop ${t.laptopId}`);
    }
    g.terminalAttempts=g.terminalAttempts.filter(x=>x.id!==t.id);
  }
  terminalTutorial(g:Game,a:Actor,data:any){
    this.terminalReady(g);const operation=z.enum(['open','close']).parse(data.operation);
    const t=g.terminalAttempts.find(t=>t.id===data.attemptId);need(t&&t.round===g.round&&!(t.kind==='task'&&t.taskFinished),'ATTEMPT','Deze poging is verlopen.',409);
    need(a.kind==='laptop'&&a.laptopId===t!.laptopId||a.kind==='player'&&a.playerId===t!.playerId&&t!.kind==='theft','FORBIDDEN','Deze tutorial hoort bij een ander apparaat.',403);
    need(t!.expiresAt>this.now(),'ATTEMPT','Deze poging is verlopen.',409);
    if(operation==='open'){
      need(t!.theft?.module!=='diversion'||t!.theft.pipeDeadline===undefined||t!.theft.pipeDeadline>this.now(),'ATTEMPT','Deze poging is verlopen.',409);
      if(t!.practicePending||t!.tutorialPausedAt!==undefined)return {ok:true};
      // Freeze the existing deadline, never replace it with a fresh full task duration.
      need(t!.kind==='theft'||(t!.taskExpiresAt??t!.expiresAt)>this.now(),'ATTEMPT','Deze poging is verlopen.',409);
      t!.tutorialPausedAt=this.now();t!.tutorialExpiresAt=t!.expiresAt;t!.expiresAt=this.now()+86400000;
    }else{
      const p=g.players.find(p=>p.id===t!.playerId)!;p.visualPractice??={};
      if(t!.kind==='task'){const gameId=t!.sequence?.[t!.taskStage??0]??this.gameId(g,t!.laptopId);p.visualPractice.games=[...new Set([...(p.visualPractice.games??[]),gameId])];if(gameId===1)p.visualPractice.budget=true;}
      else if(t!.theft)p.visualPractice.theft=[...new Set([...(p.visualPractice.theft??[]),t!.theft.module])];
      if(t!.practicePending){t!.practicePending=false;t!.taskExpiresAt=this.now()+TASK_DURATION_MS;t!.expiresAt=t!.taskExpiresAt;}
      else if(t!.tutorialPausedAt!==undefined){const elapsed=this.now()-t!.tutorialPausedAt;t!.expiresAt=t!.tutorialExpiresAt!+elapsed;if(t!.taskExpiresAt!==undefined)t!.taskExpiresAt+=elapsed;if(t!.theft?.lock)t!.theft.lock.startedAt+=elapsed;if(t!.theft?.pipeStartedAt!==undefined)t!.theft.pipeStartedAt+=elapsed;if(t!.theft?.pipeDeadline!==undefined)t!.theft.pipeDeadline+=elapsed;delete t!.tutorialPausedAt;delete t!.tutorialExpiresAt;}
    }
    return {ok:true};
  }
  confirmTerminal(g:Game,a:Actor,data:any){
    this.terminalReady(g);need(a.kind==='laptop','FORBIDDEN','Voltooi de opdracht op de terminal.',403);
    const attempt=g.terminalAttempts.find(t=>t.id===data.attemptId&&t.laptopId===(a as {laptopId:number}).laptopId);
    need(attempt&&attempt.round===g.round,'ATTEMPT','Deze poging is verlopen.',409);
    need(!attempt!.taskFinished,'ATTEMPT','Deze poging is verlopen.',409);
    need(!attempt!.practicePending,'PRACTICE','Rond eerst de oefening af.',409);
    need(attempt!.tutorialPausedAt===undefined,'PRACTICE','Sluit eerst de tutorial.',409);
    if(this.now()>=(attempt!.taskExpiresAt??attempt!.expiresAt)){this.expireTask(g,attempt!);return {ok:false,message:'Tijd verstreken. Koppel de taak opnieuw.'};}
    const t=attempt!,stage=t.taskStage??0;
    need(data.challengeId===t.challengeId||(!data.challengeId&&stage===0),'CHALLENGE','Er staat een nieuw onderdeel klaar. Herlaad de terminal.',409);
    let correct=false;
    if(t.puzzle.kind==='matching'){
      const matches=z.array(z.number().int().min(0).max(2)).length(3).parse(data.matches);
      correct=new Set(matches).size===3&&matches.every((value,i)=>value===t.puzzle.matching!.solution[i]);
    }else correct=int.parse(data.answer)===t.puzzle.answer;
    if(!correct){this.expireTask(g,t,'answer');return {ok:false,correct:false,message:'Poging mislukt. Kleine kosten afgeschreven. Koppel opnieuw; afgeronde onderdelen blijven staan.'};}
    const next=stage+1;
    if(t.kind==='task')g.taskProgress[taskProgressKey(t.playerId,t.laptopId)]=next;
    if(next>=TASK_PARTS){if(t.kind==='task')this.complete(g,t.playerId,t.laptopId);else t.taskFinished=true;return {ok:true,completed:true};}
    t.taskStage=next;t.challengeId=randomUUID();t.puzzle=makeTaskStage(this.gameId(g,t.laptopId),next,t.sequence);t.taskExpiresAt=this.now()+TASK_DURATION_MS;
    if(t.kind==='task')t.expiresAt=t.taskExpiresAt;
    this.prepareTaskTutorial(g,t);
    return {ok:true,completed:false,part:next,total:TASK_PARTS};
  }
  theftStep(g:Game,a:Actor,data:any){
    this.terminalReady(g);const p=this.player(g,a,'gambler');z.enum(['start','step','cashout','refresh']).parse(data.operation);const t=g.terminalAttempts.find(t=>t.id===data.attemptId&&t.playerId===p.id&&t.kind==='theft');
    need(t&&t.expiresAt>this.now(),'ATTEMPT','Koppel eerst een terminal.',409);
    need(t!.tutorialPausedAt===undefined,'PRACTICE','Sluit eerst de tutorial.',409);
    if(data.operation==='start'){need(!t!.theft,'STARTED','Het steelspel is al willekeurig toegewezen.',409);t!.theft=makeTheftState(this.theftRoll()===0?'lockpick':'diversion',this.now());return {ok:true};}
    const state=t!.theft;need(state,'ATTEMPT','Start eerst een steelspel.',409);
    if(state!.module==='diversion'&&state!.round<=4&&state!.pipeDeadline!==undefined&&this.now()>=state!.pipeDeadline){this.expireTask(g,t!,'timeout');return {ok:true,failed:true};}
    if(data.operation==='refresh'){need(state!.version!==2,'STARTED','Dit steelspel is al vernieuwd.',409);refreshTheftChallenge(state!,this.now());return {ok:true};}
    if(data.operation==='cashout'){
      need(state!.loot>0,'LOOT','Voltooi eerst een ronde.',409);
      const reserved=g.thefts.filter(x=>!x.debited).reduce((n,x)=>n+x.amount,0),amount=Math.min(state!.loot,this.theftRemaining(g,p.id,t!.laptopId),g.companyCash-reserved);
      need(amount>=(g.config.theftAmount??1),'FUNDS','Onvoldoende ruimte voor de minimale buit. Wacht op kasinkomsten of een nieuwe ronde.',409);this.steal(g,p.id,t!.laptopId,amount);g.terminalAttempts=g.terminalAttempts.filter(x=>x.id!==t!.id);return {ok:true,amount};
    }
    need(state!.round<=4,'ROUNDS','Alle rondes zijn voltooid. Verzamel de buit.',409);
    need(data.nonce===state!.nonce,'STEP','Deze stap is al verwerkt.',409);
    let correct=false;
    if(state!.version!==2){refreshTheftChallenge(state!,this.now());return {ok:true,refreshed:true};}
    if(state!.module==='lockpick'){
      const lock=state!.lock!;const elapsed=z.number().int().min(0).max(300000).parse(data.elapsedMs);
      const actual=this.now()-lock.startedAt;
      need(elapsed<=actual+100&&actual-elapsed<=1500,'TIMING','Timing verlopen. Wacht op de nieuwe pin.',409);
      correct=angleDistance(lockAngle(lock.offset,lock.speed,elapsed),lock.target)<=lock.width/2;
    }else{
      const rotations=z.array(z.number().int().min(0).max(3)).length(12).parse(data.rotations);
      correct=tracePipes(state!.pipes!,rotations).connected;
    }
    if(!correct){this.expireTask(g,t!,'answer');return {ok:true,failed:true};}
    state!.step++;const required=state!.module==='lockpick'?4:1;
    if(state!.step===required){state!.loot=Math.min(state!.loot+(g.config.theftAmount??5)*Math.ceil(state!.round/2),this.theftRemaining(g,p.id,t!.laptopId));state!.round++;state!.step=0;}
    if(state!.loot>=this.theftRemaining(g,p.id,t!.laptopId))state!.round=5;
    if(state!.round<=4)refreshTheftChallenge(state!,this.now());else{state!.nonce=randomUUID();delete state!.pipeDeadline;delete state!.pipeStartedAt;}
    t!.expiresAt=this.now()+300000;return {ok:true};
  }
  theftRemaining(g:Game,playerId:string,laptopId?:number){const access=cashAccess(g,playerId),maximum=theftLimits(g.config.theftAmount??1).max;return laptopId===undefined?access.remaining*maximum:access.laptops.includes(laptopId)?maximum:0;}
  autoAssign(g:Game){this.lobby(g);g.assignments=Object.fromEntries(g.players.map(p=>[p.id,[]]));this.addTasks(g);}
  touch(code:string,a:Actor){if(a.kind==='admin')return;const g=this.get(code);const key=a.kind==='player'?`player-${a.playerId}`:`${a.kind}-${a.laptopId??''}`;if(g.presence[key]&&this.now()-g.presence[key].lastSeen<25000)return;g.presence[key]={...a,lastSeen:this.now()};g.revision++;this.store.save(g);this.changed(g);}
  player(g:Game,a:Actor,role?:Role){need(a.kind==='player','FORBIDDEN','Deze actie vereist een speler.',403);const p=g.players.find(p=>p.id===(a as {playerId:string}).playerId);need(p,'FORBIDDEN','Onbekende speler.',403);need(!p!.dismissed,'SPECTATOR','Spectators kunnen deze actie niet uitvoeren.',403);if(role)need(p!.role===role,'FORBIDDEN','Je rol mag deze actie niet uitvoeren.',403);return p!;}
  admin(a:Actor){need(a.kind==='admin','FORBIDDEN','Alleen de beheerder mag deze actie uitvoeren.',403);}
  lobby(g:Game){need(g.phase==='lobby','LOBBY_ONLY','Deze instelling kan alleen vóór de start worden gewijzigd.',409);}
  test(g:Game,a:Actor){this.admin(a);need(g.config.testMode,'TEST_DISABLED','Testmodus is uitgeschakeld.',403);}
  addPlayer(g:Game,name:string){name=nameSchema.parse(name);need(!g.players.some(p=>p.name.toLowerCase()===name.toLowerCase()),'NAME_TAKEN','Deze naam is al geregistreerd.',409);
    const p={id:randomUUID(),name,role:null,dismissed:false,claimed:false,introSeen:false,checks:0,admitted:false};g.players.push(p);g.assignments[p.id]=[];return p;}
  distribute(g:Game){this.lobby(g);need(g.players.length>0,'PLAYER_COUNT','Laat eerst spelers aansluiten.',409);g.config.playerCount=g.players.length;const special=g.config.roles.manager+g.config.roles.security+g.config.roles.gambler;need(special<=g.players.length,'ROLE_COUNT','Er zijn meer speciale rollen dan spelers. Pas de aantallen aan.',409);g.config.roles.employee=g.players.length-special;need(Object.values(g.config.roles).reduce((a,b)=>a+b,0)===g.players.length,'ROLE_COUNT','De rolaantallen moeten optellen tot het aantal spelers.',409);
    const roles=Object.entries(g.config.roles).flatMap(([role,n])=>Array<Role>(n).fill(role as Role));
    for(let i=roles.length-1;i>0;i--){const j=randomInt(i+1);[roles[i],roles[j]]=[roles[j],roles[i]];}g.players.forEach((p,i)=>p.role=roles[i]);this.autoAssign(g);
  }
  claim(code:string,body:{name?:string;playerId?:string}) {
    const result=this.store.transaction(()=>{const g=this.get(code);need(g.phase!=='ended','SESSION_ENDED','De sessie is afgelopen.',409);let p;
      if(body.playerId){p=g.players.find(p=>p.id===body.playerId);need(p,'NOT_FOUND','Onbekende speler.',404);}else{this.lobby(g);p=this.addPlayer(g,body.name ?? '');}
      need(!p!.claimed,'CLAIMED','Deze naam is al gekoppeld. Vraag de beheerder om herstel.',409);p!.claimed=true;
      const token=this.store.issue({kind:'player',playerId:p!.id},g.id);g.revision++;this.store.save(g);return {g,token,playerId:p!.id};});
    this.changed(result.g);return {token:result.token,playerId:result.playerId};
  }
  complete(g:Game,playerId:string,laptopId:number){this.active(g);need(g.meeting.phase==='idle','MEETING','Opdrachten zijn tijdens een meeting gepauzeerd.',409);const p=this.player(g,{kind:'player',playerId});const t=g.tasks.find(t=>t.id===laptopId);need(t,'TASK','Onbekende opdracht.');need(g.assignments[p.id]?.includes(laptopId),g.completions.some(c=>c.playerId===p.id&&c.laptopId===laptopId)?'ALREADY_COMPLETED':'NOT_ASSIGNED',g.completions.some(c=>c.playerId===p.id&&c.laptopId===laptopId)?'Deze taak is al beloond.':'Deze taak is niet aan deze speler toegewezen.',403);
    const cycle=g.taskCycles[taskProgressKey(p.id,laptopId)]??0;
    g.terminalAttempts=g.terminalAttempts.filter(t=>t.playerId!==p.id||t.laptopId!==laptopId||t.kind!=='task');g.completions.push({playerId:p.id,laptopId,cycle,reward:t!.reward,at:this.now()});
    g.assignments[p.id]=g.assignments[p.id].filter(id=>id!==laptopId);delete g.taskProgress[taskProgressKey(p.id,laptopId)];delete g.taskSequences[taskProgressKey(p.id,laptopId)];g.taskCycles[taskProgressKey(p.id,laptopId)]=cycle+1;
    g.companyCash+=t!.reward;if(g.companyCash>=theftThreshold(g.config.companyGoal))g.theftUnlocked=true;this.ledger(g,'task',t!.reward,`${p.name} · laptop ${laptopId}`);this.evaluate(g);
  }
  steal(g:Game,playerId:string,laptopId:number,amount:number){this.active(g);need(g.meeting.phase==='idle','MEETING','Diefstal is tijdens een meeting gepauzeerd.',409);this.player(g,{kind:'player',playerId},'gambler');amount=positive.parse(amount);need(g.theftUnlocked,'LOCKED','Diefstal is nog niet ontgrendeld.',409);need(g.config.moneyLaptops.includes(laptopId),'LOCATION','Deze laptop is niet verbonden met de kas.',403);
    need(cashAccess(g,playerId).laptops.includes(laptopId),'CASH_USED','Deze kas is deze ronde al door jou gebruikt. Kies de andere kas of wacht op de meeting.',409);
    const reserved=g.thefts.filter(t=>!t.debited).reduce((a,t)=>a+t.amount,0);need(amount<=g.companyCash-reserved,'FUNDS','Onvoldoende ongereserveerd bedrijfsgeld.',409);
    const at=this.now();g.thefts.push({round:g.round,id:randomUUID(),playerId,laptopId,amount,collectedAt:at,debitAt:at+30000,alertAt:at+30000,debited:false,alerted:false});g.gamblerCash+=amount;this.ledger(g,'theft-collected',amount,`Laptop ${laptopId}`);this.evaluate(g);
  }
  gamble(g:Game,playerId:string,stake:number,payout:number){this.active(g);need(g.meeting.phase==='idle','MEETING','Gokken is tijdens een meeting gepauzeerd.',409);this.player(g,{kind:'player',playerId},'gambler');stake=positive.parse(stake);payout=int.parse(payout);need(stake<=g.gamblerCash,'FUNDS','Onvoldoende geld op de gedeelde rekening.',409);g.gamblerCash+=payout-stake;this.ledger(g,'gamble',payout-stake,`Inzet €${stake.toLocaleString('nl-NL')}, uitbetaling €${payout.toLocaleString('nl-NL')}`);this.evaluate(g);}
  meeting(g:Game,source:'automatic'|'emergency'|'admin'){this.active(g);need(g.meeting.phase==='idle','MEETING_ACTIVE','Er is al een meeting.',409);if(source==='emergency')need(!g.cooldownUntil || this.now()>=g.cooldownUntil,'COOLDOWN','De emergency-knop koelt nog af.',409);
    g.pendingSpin=null;g.meeting={phase:'gathering',source,startedAt:this.now(),deadline:this.now()+g.config.gatherMs,dismissedId:null};g.nextMeetingAt=null;g.terminalAttempts=[];this.ledger(g,'meeting',0,source);}
  discuss(g:Game){this.active(g);need(g.meeting.phase==='gathering','MEETING_PHASE','Er is geen verzamelfase.',409);g.meeting.phase='discussion';g.meeting.startedAt=this.now();g.meeting.deadline=this.now()+g.config.discussMs;}
  endMeeting(g:Game,at=this.now()){this.active(g);need(g.meeting.phase==='dismissal','MEETING_PHASE','Ga eerst naar de ontslagfase.',409);g.meeting={phase:'idle',source:null,startedAt:null,deadline:null,dismissedId:null};g.round++;g.spinsThisRound={};this.rotateCash(g);this.addTasks(g);g.players.forEach(p=>p.checks=0);g.nextMeetingAt=at+g.config.autoMeetingMs;g.cooldownUntil=at+g.config.cooldownMs;this.ledger(g,'round',0,`Ronde ${g.round}`);}
  dismiss(g:Game,playerId:string,simulation=false){this.active(g);if(!simulation){need(g.meeting.phase==='dismissal','MEETING_PHASE','Ontslag kan alleen tijdens de ontslagfase.',409);need(!g.meeting.dismissedId,'DISMISS_LIMIT','Er kan maar één speler per meeting worden ontslagen.',409);}
    const p=g.players.find(p=>p.id===playerId);need(p && !p.dismissed && p.role,'PLAYER','Deze speler kan niet worden ontslagen.',409);p!.dismissed=true;if(g.pendingSpin?.playerId===playerId)g.pendingSpin=null;g.terminalAttempts=g.terminalAttempts.filter(t=>t.playerId!==playerId);if(!simulation)g.meeting.dismissedId=p!.id;g.lastDismissal={playerId:p!.id,name:p!.name,role:p!.role!,at:this.now()};this.ledger(g,'dismiss',0,p!.name);this.evaluate(g);
  }
  evaluate(g:Game){if(g.phase!=='playing')return;
    if(purchaseGoal(g.config.gamblerGoal??0,g.purchases).complete){this.finish(g,'gamblers','all-items-purchased');return;}
    const reserved=g.thefts.filter(t=>!t.debited).reduce((n,t)=>n+t.amount,0);
    if(g.companyCash-reserved>=g.config.companyGoal){this.finish(g,'employees','company-goal');return;}
    if(g.companyCash<=0){this.finish(g,'gamblers','company-bankrupt');return;}
    const remaining=g.players.filter(p=>!p.dismissed);if(remaining.length>0&&remaining.every(p=>p.role==='gambler')){this.finish(g,'gamblers','only-gamblers-remain');return;}
    const gamblers=g.players.filter(p=>p.role==='gambler');const both=gamblers.length>0 && gamblers.every(p=>p.dismissed);
    if(both){this.finish(g,'employees','gamblers-dismissed');return;}

  }
  finish(g:Game,winner:Game['winner'],reason:string){g.phase='ended';g.pendingSpin=null;g.terminalAttempts=[];g.winner=winner;g.endReason=reason;g.nextMeetingAt=null;g.summary={endedAt:this.now(),gamblerWealth:this.wealth(g),companyCash:g.companyCash-g.thefts.filter(t=>!t.debited).reduce((n,t)=>n+t.amount,0),gamblerCash:g.gamblerCash,players:g.players.map(p=>({id:p.id,name:p.name,role:p.role,dismissed:p.dismissed,completed:g.completions.filter(c=>c.playerId===p.id).length,assigned:(g.assignments[p.id]??[]).length+g.completions.filter(c=>c.playerId===p.id).length,won:winner==='gamblers'?p.role==='gambler':winner==='employees'&&p.role!=='gambler'&&!p.dismissed}))};this.ledger(g,'end',0,reason);}
  start(g:Game){this.lobby(g);need(g.players.length===g.config.playerCount && g.players.every(p=>p.role),'ROLES','Vul de lobby en deel eerst rollen uit.',409);need(g.config.gamblerGoal!==null,'GOAL','Stel het gezamenlijke Gokkersdoel in.',409);need(g.players.every(p=>p.admitted),'WAITING','Laat eerst alle spelers toe.',409);need(Object.values(g.assignments).some(x=>x.length),'ASSIGNMENTS','Wijs eerst taken toe.',409);for(const p of g.players)g.assignments[p.id]=(g.assignments[p.id]??[]).slice(0,2);g.phase=g.config.introVideoUrl?'briefing':'playing';g.summary=null;g.round=1;if(g.config.autoEconomy)Object.assign(g.config,economyFor(g.players.length));g.companyCash=g.config.startCapital;g.theftUnlocked=g.companyCash>=theftThreshold(g.config.companyGoal);g.nextMeetingAt=g.phase==='playing'?this.now()+g.config.autoMeetingMs:null;this.evaluate(g);}
  command(code:string,a:Actor,id:string,action:string,data:any={}):any {
    const result=this.store.transaction(()=>{let g=this.get(code);const actorKey=JSON.stringify(a);const signature=createHash('sha256').update(JSON.stringify({action,data})).digest('hex');const cached=this.store.cached(g.id,actorKey,id);if(cached!==undefined){need(cached.signature===signature,'REQUEST_CONFLICT','Dit verzoek-ID is al voor een andere actie gebruikt.',409);return {g,result:cached.result,changed:false};}let response:any={ok:true};
      switch(action){
        case 'configure': {this.admin(a);this.lobby(g);const config=configSchema.parse(data.config);const roleChange=JSON.stringify(config.roles)!==JSON.stringify(g.config.roles);g.config=config;g.companyCash=config.startCapital;if(roleChange)g.players.forEach(p=>p.role=null);break;}
        case 'floor-plan':{this.admin(a);this.lobby(g);const plan=floorPlanSchema.parse(data.plan);this.store.setFloorPlan(plan);g.floorPlan=plan;g.tasks.forEach(t=>{const gameId=this.gameId(g,t.id),[icon,label]=financialTasks[gameId-1];Object.assign(t,{icon,label,module:`finance-${gameId}`});});break;}
        case 'locations':this.admin(a);g.config.moneyLaptops=configSchema.shape.moneyLaptops.parse(data.ids);break;
        case 'test-mode':this.admin(a);g.config.testMode=z.boolean().parse(data.enabled);break;
        case 'add-player':this.admin(a);this.lobby(g);response={ok:true,playerId:this.addPlayer(g,data.name).id};break;
        case 'rename-player':{this.admin(a);this.lobby(g);const p=g.players.find(p=>p.id===data.playerId);need(p,'PLAYER','Speler bestaat niet.');const name=nameSchema.parse(data.name);need(!g.players.some(q=>q.id!==p!.id&&q.name.toLowerCase()===name.toLowerCase()),'NAME_TAKEN','Naam bestaat al.');p!.name=name;break;}
        case 'remove-player':{this.admin(a);this.lobby(g);need(g.players.some(p=>p.id===data.playerId),'PLAYER','Speler bestaat niet.');g.players=g.players.filter(p=>p.id!==data.playerId);delete g.assignments[data.playerId];this.store.db.prepare('DELETE FROM credentials WHERE session_id=? AND actor=?').run(g.id,JSON.stringify({kind:'player',playerId:data.playerId}));g.players.forEach(p=>p.role=null);break;}
        case 'recover-player':{this.admin(a);const p=g.players.find(p=>p.id===data.playerId);need(p,'PLAYER','Speler bestaat niet.');this.store.db.prepare('DELETE FROM credentials WHERE session_id=? AND actor=?').run(g.id,JSON.stringify({kind:'player',playerId:p!.id}));p!.claimed=true;response={ok:true,token:this.store.issue({kind:'player',playerId:p!.id},g.id)};break;}
        case 'role-counts':{this.admin(a);this.lobby(g);const roles=z.object({manager:int.max(1),security:int,gambler:int}).strict().parse(data.roles);g.config.roles={...roles,employee:Math.max(0,g.players.length-roles.manager-roles.security-roles.gambler)};g.players.forEach(p=>p.role=null);g.assignments=Object.fromEntries(g.players.map(p=>[p.id,[]]));break;}
        case 'apply-job':{need(a.kind==='player','FORBIDDEN','Alleen spelers kunnen solliciteren.',403);const p=g.players.find(p=>p.id===(a as {playerId:string}).playerId);need(p?.dismissed,'FORBIDDEN','Dit is voor ontslagen spelers.',403);this.active(g);const jobId=z.number().int().min(0).max(4095).parse(data.jobId);const existing=g.jobs.find(j=>j.playerId===p!.id&&j.jobId===jobId);if(existing){response={ok:true};break;}need(!g.jobs.some(j=>j.playerId===p!.id&&['checking','provisional'].includes(j.stage)),'JOB_BUSY','Je sollicitatie wordt nog beoordeeld.',409);const at=this.now();g.jobs.push({id:randomUUID(),playerId:p!.id,jobId,startedAt:at,checkedAt:at+2500,finishedAt:at+5000,tease:true,accepted:false,reason:['De functie is vervallen.','Een andere kandidaat is gekozen.','De vacature is intern ingevuld.','De extra controle was helaas negatief.'][jobId%4],stage:'checking'});break;}
        case 'distribute':this.admin(a);this.distribute(g);break;
        case 'auto-assign':this.admin(a);this.autoAssign(g);break;
        case 'admit-all':this.admin(a);this.lobby(g);g.players.forEach(p=>p.admitted=true);break;
        case 'admit':{this.admin(a);this.lobby(g);const p=g.players.find(p=>p.id===data.playerId);need(p,'PLAYER','Onbekende speler.');p!.admitted=true;break;}
        case 'assign':{this.admin(a);this.lobby(g);need(g.players.some(p=>p.id===data.playerId),'PLAYER','Speler bestaat niet.');g.assignments[data.playerId]=z.array(z.number().int().min(1).max(8)).max(MAX_OPEN_TASKS).refine(a=>new Set(a).size===a.length).parse(data.ids).sort((a,b)=>a-b);break;}
        case 'rewards':{this.admin(a);this.lobby(g);const rewards=z.array(int).length(8).parse(data.rewards);g.tasks.forEach((t,i)=>t.reward=rewards[i]);break;}
        case 'demo':{this.admin(a);this.lobby(g);need([13,14].includes(g.config.playerCount),'DEMO_COUNT','Demodata is voor 13 of 14 spelers.',409);need(g.players.length===0,'DEMO','Demodata kan alleen in een lege lobby.',409);g.config.testMode=true;g.config.moneyLaptops=[2,6];['Noor','Sam','Yara','Milan','Lina','Daan','Amir','Tess','Bo','Evi','Finn','Sara','Jules','Maya'].slice(0,g.config.playerCount).forEach(n=>this.addPlayer(g,n));this.distribute(g);g.players.forEach(p=>p.admitted=true);break;}
        case 'launch':this.admin(a);this.lobby(g);need(g.players.every(p=>p.admitted),'WAITING','Laat eerst iedereen toe.',409);this.distribute(g);this.start(g);break;
        case 'start':this.admin(a);this.start(g);break;
        case 'replay':{
          this.admin(a);need(g.phase==='ended','REPLAY','Beëindig eerst het huidige spel.',409);
          g.phase='lobby';g.taskProgress={};g.taskSequences={};g.taskDecks={};g.taskCycles={};g.spinsThisRound={};g.purchases=[];g.pausedAt=null;g.summary=null;g.winner=null;g.endReason=null;
          g.jobs=[];g.pendingSpin=null;g.taskFailures=[];g.lastGambles={};g.assignments={};
          g.companyCash=g.config.startCapital;g.gamblerCash=0;g.completions=[];g.terminalAttempts=[];
          g.thefts=[];g.investigations=[];g.ledger=[];g.theftUnlocked=false;
          g.meeting={phase:'idle',source:null,startedAt:null,deadline:null,dismissedId:null};
          g.round=0;g.nextMeetingAt=null;g.cooldownUntil=null;g.lastDismissal=null;
          g.players.forEach(p=>{p.role=null;p.dismissed=false;p.checks=0;p.introSeen=false;p.visualPractice={};});
          break;
        }
        case 'finish-briefing':{if(a.kind!=='board')this.admin(a);need(g.phase==='briefing','PHASE','Geen briefing actief.',409);g.phase='playing';g.nextMeetingAt=this.now()+g.config.autoMeetingMs;break;}
        case 'pause':this.admin(a);this.active(g);g.phase='paused';g.pausedAt=this.now();break;
        case 'resume':{this.admin(a);need(g.phase==='paused','PHASE','Het spel is niet gepauzeerd.',409);const delta=this.now()-g.pausedAt!;this.shift(g,delta);g.phase='playing';g.pausedAt=null;break;}
        case 'end':this.admin(a);need(g.phase!=='ended','PHASE','Het spel is al geëindigd.',409);this.finish(g,'draw','admin-ended');break;
        case 'intro':{const p=this.player(g,a);p.introSeen=true;break;}
        case 'request-meeting': {if(a.kind==='emergency')this.meeting(g,'emergency');else if(a.kind==='admin')this.meeting(g,'admin');else {throw new GameError('FORBIDDEN','Gebruik de gekoppelde emergency-knop.',403);}break;}
        case 'discuss':if(a.kind!=='admin')this.player(g,a,'manager');this.discuss(g);break;
        case 'dismissal':if(a.kind!=='admin')this.player(g,a,'manager');this.active(g);need(g.meeting.phase==='discussion','MEETING_PHASE','Start eerst het overleg.',409);g.meeting.phase='dismissal';g.meeting.startedAt=this.now();g.meeting.deadline=null;break;
        case 'dismiss-nobody':if(a.kind!=='admin')this.player(g,a,'manager');this.active(g);need(g.meeting.phase==='discussion'||g.meeting.phase==='dismissal','MEETING_PHASE','Start eerst het overleg.',409);need(!g.meeting.dismissedId,'DISMISS_LIMIT','Er is al iemand ontslagen.',409);g.meeting.phase='dismissal';this.endMeeting(g);break;
        case 'end-meeting':if(a.kind!=='admin')this.player(g,a,'manager');this.endMeeting(g);break;
        case 'dismiss':if(a.kind!=='admin')this.player(g,a,'manager');this.dismiss(g,z.string().parse(data.playerId));break;
        case 'investigate':{this.terminalReady(g);const p=this.player(g,a,'security');need(p.checks<2,'CHECK_LIMIT','Je hebt je twee controles deze ronde gebruikt.',409);const laptopId=z.number().int().min(1).max(8).parse(data.laptopId);need(typeof data.code==='string'&&/^[0-5]{4}$/.test(data.code)&&data.code===g.laptopCodes[laptopId],'CODE','Voer de code van deze laptop in om te scannen.',403);const times=g.thefts.filter(t=>t.laptopId===laptopId&&t.alerted).map(t=>t.collectedAt);p.checks++;const entry={id:randomUUID(),playerId:p.id,laptopId,at:this.now(),round:g.round,transactionTimes:times,failures:g.taskFailures.filter(f=>f.laptopId===laptopId).map(f=>f.at)};g.investigations.push(entry);response={ok:true,investigation:entry};break;}
        case 'task-proof':{const p=this.player(g,a);const laptopId=z.number().int().min(1).max(8).parse(data.laptopId);const task=g.tasks.find(t=>t.id===laptopId)!;const adapter=taskAdapters.get(task.module);need(adapter,'PLACEHOLDER','De financiële minigame is nog niet gekoppeld.',409);need(adapter!.verify(data.proof,{sessionId:g.id,playerId:p.id,laptopId}),'PROOF','Ongeldig spelbewijs.',403);this.complete(g,p.id,laptopId);break;}
        case 'terminal-begin':response=this.beginTerminal(g,a,data);break;
        case 'terminal-tutorial':response=this.terminalTutorial(g,a,data);break;
        case 'skip-tutorials':{
          this.terminalReady(g);
          const t=a.kind==='laptop'?g.terminalAttempts.find(t=>t.id===data.attemptId&&t.laptopId===a.laptopId):a.kind==='player'?g.terminalAttempts.find(t=>t.playerId===a.playerId):undefined;
          need(a.kind==='player'||(a.kind==='laptop'&&t),'FORBIDDEN','Geen gekoppelde speler.',403);
          const p=this.player(g,a.kind==='player'?a:{kind:'player',playerId:t!.playerId});
          // Legacy action name: skip all steps of the current lesson, never future lessons.
          p.visualPractice??={};if(!t)p.visualPractice.pairing=true;
          if(t&&(t.practicePending||t.tutorialPausedAt!==undefined))this.terminalTutorial(g,t.kind==='task'?{kind:'laptop',laptopId:t.laptopId}:{kind:'player',playerId:p.id},{attemptId:t.id,operation:'close'});
          break;
        }
        case 'wheel-tutorial':{this.terminalReady(g);const p=this.player(g,a,'gambler');p.visualPractice={...p.visualPractice,wheel:true};break;}
        case 'pairing-practice':{this.terminalReady(g);const p=this.player(g,a);need(p.admitted,'WAITING','Wacht op toelating.',403);need(data.code==='0241','PRACTICE','Probeer de voorbeeldvormen opnieuw.');p.visualPractice={...p.visualPractice,pairing:true};break;}
        case 'terminal-practice':{this.terminalReady(g);need(a.kind==='laptop','FORBIDDEN','Oefen op de gekoppelde laptop.',403);const t=g.terminalAttempts.find(t=>t.id===data.attemptId&&t.laptopId===(a as {laptopId:number}).laptopId);need(t&&t.visualMode&&t.expiresAt>this.now(),'ATTEMPT','Deze poging is verlopen.',409);need(data.answer===45&&data.review===1&&JSON.stringify(data.matches)==='[2,0,1]','PRACTICE','Probeer de oefening opnieuw.');if(t!.practicePending){const p=g.players.find(p=>p.id===t!.playerId)!;p.visualPractice={...p.visualPractice,budget:true,games:[...new Set([...(p.visualPractice?.games??[]),...(t!.sequence??[1,13,14])])]};t!.practicePending=false;t!.taskExpiresAt=this.now()+TASK_DURATION_MS;t!.expiresAt=t!.taskExpiresAt;}break;}
        case 'terminal-confirm':response=this.confirmTerminal(g,a,data);break;
        case 'terminal-cancel':{const p=this.player(g,a);g.terminalAttempts=g.terminalAttempts.filter(t=>t.playerId!==p.id);break;}
        case 'steal':response=this.theftStep(g,a,data);break;
        case 'buy-item':{this.terminalReady(g);const p=this.player(g,a,'gambler'),item=shopCatalog(g.config.gamblerGoal??0).find(i=>i.id===data.itemId);need(item,'ITEM','Onbekend artikel.',404);need(!g.purchases.some(p=>p.itemId===item!.id),'OWNED','Dit artikel is al van jullie.',409);need(g.gamblerCash-(g.pendingSpin?.stake??0)>=item!.price,'FUNDS','Onvoldoende buit voor dit artikel.',409);g.gamblerCash-=item!.price;g.purchases.push({id:randomUUID(),itemId:item!.id,playerId:p.id,price:item!.price,at:this.now()});this.ledger(g,'shop',-item!.price,item!.name);this.evaluate(g);break;}
        case 'gamble':{this.terminalReady(g);const p=this.player(g,a,'gambler'),stake=positive.parse(data.stake);need((g.spinsThisRound[p.id]??0)<SPINS_PER_ROUND,'SPIN_LIMIT','Je hebt deze ronde al twee keer gedraaid. Wacht op de volgende meeting.',409);need(!g.pendingSpin,'SPIN','Het gedeelde rad draait nog.',409);need(stake<=g.gamblerCash,'FUNDS','Onvoldoende geld op de gedeelde rekening.',409);need(stake<=maxWheelStake(g.config.gamblerGoal??0),'STAKE_LIMIT','Deze inzet is te hoog. Kies een kleiner bedrag.',409);g.spinsThisRound[p.id]=(g.spinsThisRound[p.id]??0)+1;const segment=this.roll();g.pendingSpin={id:randomUUID(),playerId:p.id,startedAt:this.now(),endsAt:this.now()+5000,stake,segment,payout:wheelPayout(segment,stake)};response={ok:true,serverTime:this.now(),spin:{id:g.pendingSpin.id,startedAt:g.pendingSpin.startedAt,endsAt:g.pendingSpin.endsAt,stake,segment}};break;}
        case 'test-task':this.test(g,a);this.complete(g,z.string().parse(data.playerId),z.number().int().min(1).max(8).parse(data.laptopId));break;
        case 'test-theft':this.test(g,a);this.steal(g,z.string().parse(data.playerId),z.number().int().min(1).max(8).parse(data.laptopId),positive.parse(data.amount));break;
        case 'test-gamble':this.test(g,a);this.gamble(g,z.string().parse(data.playerId),positive.parse(data.stake),int.parse(data.payout));break;
        case 'test-cash':{this.test(g,a);const reserved=g.thefts.filter(t=>!t.debited).reduce((a,t)=>a+t.amount,0);const amount=int.parse(data.amount);need(amount>=reserved,'RESERVED','Dit geld is al voor diefstal gereserveerd.',409);g.companyCash=amount;if(amount>=25)g.theftUnlocked=true;this.ledger(g,'test-company',amount,'Testcorrectie');this.evaluate(g);break;}
        case 'test-pot':this.test(g,a);g.gamblerCash=int.parse(data.amount);this.ledger(g,'test-pot',g.gamblerCash,'Testcorrectie');this.evaluate(g);break;
        case 'test-meeting':this.test(g,a);this.meeting(g,'admin');break;
        case 'test-dismiss':this.test(g,a);this.dismiss(g,z.string().parse(data.playerId),true);break;
        case 'test-evaluate':this.test(g,a);this.evaluate(g);break;
        case 'test-reset':{this.test(g,a);g.phase='lobby';g.taskProgress={};g.taskSequences={};g.taskDecks={};g.taskCycles={};g.spinsThisRound={};g.purchases=[];g.jobs=[];g.pendingSpin=null;g.taskFailures=[];g.summary=null;g.lastGambles={};g.companyCash=g.config.startCapital;g.gamblerCash=0;g.completions=[];g.terminalAttempts=[];g.thefts=[];g.investigations=[];g.ledger=[];g.theftUnlocked=false;g.meeting={phase:'idle',source:null,startedAt:null,deadline:null,dismissedId:null};g.round=0;g.nextMeetingAt=null;g.cooldownUntil=null;g.pausedAt=null;g.lastDismissal=null;g.winner=null;g.endReason=null;g.players.forEach(p=>{p.dismissed=false;p.checks=0;p.introSeen=false;p.visualPractice={};});break;}
        default:throw new GameError('ACTION','Onbekende actie.',404);
      }
      g.revision++;this.store.save(g);this.store.cache(g.id,actorKey,id,response,signature);return {g,result:response,changed:true};});
    if(result.changed){this.changed(result.g);if(action==='floor-plan')for(const other of this.store.all())if(other.id!==result.g.id)this.changed(other);}return result.result;
  }
  shift(g:Game,ms:number){if(g.pendingSpin){g.pendingSpin.startedAt+=ms;g.pendingSpin.endsAt+=ms;}g.terminalAttempts.forEach(t=>{t.expiresAt+=ms;if(t.tutorialPausedAt!==undefined)t.tutorialPausedAt+=ms;if(t.tutorialExpiresAt!==undefined)t.tutorialExpiresAt+=ms;if(t.theft?.lock)t.theft.lock.startedAt+=ms;if(t.taskExpiresAt)t.taskExpiresAt+=ms;if(t.theft?.pipeDeadline)t.theft.pipeDeadline+=ms;if(t.theft?.pipeStartedAt)t.theft.pipeStartedAt+=ms;});g.jobs.filter(j=>['checking','provisional'].includes(j.stage)).forEach(j=>{j.startedAt+=ms;j.checkedAt+=ms;j.finishedAt+=ms;});if(g.nextMeetingAt)g.nextMeetingAt+=ms;if(g.cooldownUntil)g.cooldownUntil+=ms;if(g.meeting.deadline)g.meeting.deadline+=ms;if(g.meeting.startedAt)g.meeting.startedAt+=ms;g.thefts.forEach(t=>{if(!t.debited)t.debitAt+=ms;if(!t.alerted)t.alertAt+=ms;});}
  tick():void {
    for(const stored of this.store.all()) {if(stored.phase==='lobby'||stored.phase==='paused')continue;let dirty=false;
      const g=this.store.transaction(()=>{const g=this.get(stored.id);const now=this.now();for(const t of g.thefts){if(!t.debited&&now>=t.debitAt){g.companyCash-=t.amount;t.debited=true;this.ledger(g,'theft-debit',-t.amount,`Laptop ${t.laptopId}`);dirty=true;}if(!t.alerted&&now>=t.alertAt){t.alerted=true;dirty=true;}if(t.debited&&!t.redCleared&&now>=t.debitAt+8000){t.redCleared=true;dirty=true;}}
        if(g.phase==='playing') {for(const f of g.taskFailures)if(!f.redCleared&&f.loss&&now>=f.at+8000){f.redCleared=true;dirty=true;}for(const job of g.jobs){if(['checking','provisional'].includes(job.stage)){const stage=now>=job.finishedAt?('rejected'):now>=job.checkedAt&&job.tease?'provisional':'checking';if(stage!==job.stage){job.stage=stage;dirty=true;}}}if(g.meeting.phase==='idle'&&g.nextMeetingAt!==null&&now>=g.nextMeetingAt&&(!g.pendingSpin||g.nextMeetingAt<=g.pendingSpin.endsAt)){this.meeting(g,'automatic');dirty=true;}if(g.pendingSpin&&now>=g.pendingSpin.endsAt){const spin=g.pendingSpin;g.pendingSpin=null;this.gamble(g,spin.playerId,spin.stake,spin.payout);g.lastGambles[spin.playerId]={id:spin.id,at:now,stake:spin.stake,payout:spin.payout,win:spin.payout>spin.stake,segment:spin.segment};dirty=true;}for(const t of [...g.terminalAttempts])if(t.tutorialPausedAt===undefined&&((t.kind==='task'&&t.expiresAt<=now)||(t.kind==='theft'&&t.theft?.module==='diversion'&&t.theft.round<=4&&t.theft.pipeDeadline!==undefined&&t.theft.pipeDeadline<=now))){this.expireTask(g,t);dirty=true;}const remaining=g.terminalAttempts.filter(t=>t.expiresAt>now);if(remaining.length!==g.terminalAttempts.length){g.terminalAttempts=remaining;dirty=true;}
          if(g.phase==='playing'&&g.meeting.phase==='idle' && g.nextMeetingAt!==null && now>=g.nextMeetingAt){this.meeting(g,'automatic');dirty=true;}
          if(dirty)this.evaluate(g);}
        if(dirty){g.revision++;this.store.save(g);}return g;});if(dirty)this.changed(g);
    }
  }
}
