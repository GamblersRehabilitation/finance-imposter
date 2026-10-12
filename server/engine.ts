import { createHash, randomInt, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { GameError, type Game, type Role, type Actor, type Config } from './types.js';
import { Store } from './store.js';
import { taskAdapters, gamblingAdapters } from './minigames.js';
const int = z.number().int().min(0).max(100000);
const positive = z.number().int().min(1).max(100000);
const roleSchema=z.enum(['manager','security','gambler','employee']);
const configSchema=z.object({
  playerCount:z.number().int().min(1).max(50), roles:z.object({manager:int.max(1),security:int, gambler:int,employee:int}),
  startCapital:int.max(100), companyGoal:z.literal(100), gamblerGoal:positive.nullable(),
  autoMeetingMs:z.number().int().min(1000).max(3600000),gatherMs:z.number().int().min(1000).max(3600000),discussMs:z.number().int().min(1000).max(3600000),cooldownMs:z.number().int().min(1000).max(3600000),
  workerWin:z.enum(['dismiss','dismiss-and-finance']).nullable(),zeroCash:z.enum(['continue','draw']).nullable(),dismissedGambler:z.enum(['shares','excluded']).nullable(),
  moneyLaptops:z.array(z.number().int().min(1).max(8)).max(2).refine(a=>new Set(a).size===a.length),testMode:z.boolean(),
  introVideoUrl:z.string().url().refine(s=>/^https?:\/\//.test(s)).nullable()
}).strict();
const nameSchema=z.string().trim().min(1).max(24);
const need=(ok:unknown,code:string,message:string,status=400):void=>{if(!ok)throw new GameError(code,message,status);};
export function defaultConfig():Config {return {playerCount:14,roles:{manager:1,security:1,gambler:2,employee:10},startCapital:10,companyGoal:100,gamblerGoal:null,autoMeetingMs:180000,gatherMs:30000,discussMs:90000,cooldownMs:60000,workerWin:'dismiss',zeroCash:'continue',dismissedGambler:'excluded',moneyLaptops:[],testMode:false,introVideoUrl:null};}
const tasks = [ ['calculator','Begroting'],['chart','Investeren'],['receipt','Boekhouding'],['piggy','Sparen'],['shield','Verzekeren'],['coins','Kasbeheer'],['briefcase','Ondernemen'],['scale','Risico'] ];
export class Engine {
  constructor(public store:Store, public now:()=>number=Date.now, public changed:(g:Game)=>void=()=>{}){}
  get(code:string):Game {const g=this.store.get(code);if(!g)throw new GameError('NOT_FOUND','Deze sessie bestaat niet.',404);return g;}
  create(title='Nieuwe vestiging'):Game {
    let code:string;do{code=randomInt(100000,1000000).toString();}while(this.store.get(code));
    const g:Game={id:randomUUID(),code,title:nameSchema.parse(title),revision:0,createdAt:this.now(),phase:'lobby',pausedAt:null,config:defaultConfig(),players:[],tasks:tasks.map(([icon,label],i)=>({id:i+1,icon,label,reward:0,module:`task-${i+1}-placeholder`})),assignments:{},completions:[],companyCash:10,gamblerCash:0,theftUnlocked:false,thefts:[],investigations:[],ledger:[],meeting:{phase:'idle',source:null,startedAt:null,deadline:null,dismissedId:null},round:0,nextMeetingAt:null,cooldownUntil:null,lastDismissal:null,winner:null,endReason:null};
    this.store.save(g);return g;
  }
  ledger(g:Game,kind:string,amount:number,detail:string){g.ledger.push({id:randomUUID(),kind,amount,company:g.companyCash,gamblers:g.gamblerCash,at:this.now(),detail});}
  total(g:Game){return g.config.startCapital + Object.values(g.assignments).flat().reduce((n,id)=>n+g.tasks.find(t=>t.id===id)!.reward,0);}
  active(g:Game){need(g.phase==='playing','NOT_ACTIVE','Het spel is niet actief.',409);}
  player(g:Game,a:Actor,role?:Role){need(a.kind==='player','FORBIDDEN','Deze actie vereist een speler.',403);const p=g.players.find(p=>p.id===(a as {playerId:string}).playerId);need(p,'FORBIDDEN','Onbekende speler.',403);need(!p!.dismissed,'SPECTATOR','Spectators kunnen deze actie niet uitvoeren.',403);if(role)need(p!.role===role,'FORBIDDEN','Je rol mag deze actie niet uitvoeren.',403);return p!;}
  admin(a:Actor){need(a.kind==='admin','FORBIDDEN','Alleen de beheerder mag deze actie uitvoeren.',403);}
  lobby(g:Game){need(g.phase==='lobby','LOBBY_ONLY','Deze instelling kan alleen vóór de start worden gewijzigd.',409);}
  test(g:Game,a:Actor){this.admin(a);need(g.config.testMode,'TEST_DISABLED','Testmodus is uitgeschakeld.',403);}
  addPlayer(g:Game,name:string){name=nameSchema.parse(name);need(g.players.length<g.config.playerCount,'FULL','De sessie is vol.',409);need(!g.players.some(p=>p.name.toLowerCase()===name.toLowerCase()),'NAME_TAKEN','Deze naam is al geregistreerd.',409);
    const p={id:randomUUID(),name,role:null,dismissed:false,claimed:false,introSeen:false,checks:0};g.players.push(p);g.assignments[p.id]=[];return p;}
  distribute(g:Game){this.lobby(g);need(g.players.length===g.config.playerCount,'PLAYER_COUNT','Voeg eerst alle ingestelde spelers toe.',409);need(Object.values(g.config.roles).reduce((a,b)=>a+b,0)===g.players.length,'ROLE_COUNT','De rolaantallen moeten optellen tot het aantal spelers.',409);
    const roles=Object.entries(g.config.roles).flatMap(([role,n])=>Array<Role>(n).fill(role as Role));
    for(let i=roles.length-1;i>0;i--){const j=randomInt(i+1);[roles[i],roles[j]]=[roles[j],roles[i]];}g.players.forEach((p,i)=>p.role=roles[i]);
  }
  claim(code:string,body:{name?:string;playerId?:string}) {
    const result=this.store.transaction(()=>{const g=this.get(code);need(g.phase!=='ended','SESSION_ENDED','De sessie is afgelopen.',409);let p;
      if(body.playerId){p=g.players.find(p=>p.id===body.playerId);need(p,'NOT_FOUND','Onbekende speler.',404);}else{this.lobby(g);p=this.addPlayer(g,body.name ?? '');}
      need(!p!.claimed,'CLAIMED','Deze naam is al gekoppeld. Vraag de beheerder om herstel.',409);p!.claimed=true;
      const token=this.store.issue({kind:'player',playerId:p!.id},g.id);g.revision++;this.store.save(g);return {g,token,playerId:p!.id};});
    this.changed(result.g);return {token:result.token,playerId:result.playerId};
  }
  complete(g:Game,playerId:string,laptopId:number){this.active(g);need(g.meeting.phase==='idle','MEETING','Opdrachten zijn tijdens een meeting gepauzeerd.',409);const p=this.player(g,{kind:'player',playerId});const t=g.tasks.find(t=>t.id===laptopId);need(t,'TASK','Onbekende opdracht.');need(g.assignments[p.id]?.includes(laptopId),'NOT_ASSIGNED','Deze taak is niet aan deze speler toegewezen.',403);
    need(!g.completions.some(c=>c.playerId===p.id && c.laptopId===laptopId),'ALREADY_COMPLETED','Deze taak is al beloond.',409);
    g.completions.push({playerId:p.id,laptopId,reward:t!.reward,at:this.now()});g.companyCash+=t!.reward;if(g.companyCash>=25)g.theftUnlocked=true;this.ledger(g,'task',t!.reward,`${p.name} · laptop ${laptopId}`);this.evaluate(g);
  }
  steal(g:Game,playerId:string,laptopId:number,amount:number){this.active(g);need(g.meeting.phase==='idle','MEETING','Diefstal is tijdens een meeting gepauzeerd.',409);this.player(g,{kind:'player',playerId},'gambler');amount=positive.parse(amount);need(g.theftUnlocked,'LOCKED','Diefstal is nog niet ontgrendeld.',409);need(g.config.moneyLaptops.includes(laptopId),'LOCATION','Deze laptop is niet verbonden met de kas.',403);
    const reserved=g.thefts.filter(t=>!t.debited).reduce((a,t)=>a+t.amount,0);need(amount<=g.companyCash-reserved,'FUNDS','Onvoldoende ongereserveerd bedrijfsgeld.',409);
    const at=this.now();g.thefts.push({id:randomUUID(),playerId,laptopId,amount,collectedAt:at,debitAt:at+5000,alertAt:at+10000,debited:false,alerted:false});g.gamblerCash+=amount;this.ledger(g,'theft-collected',amount,`Laptop ${laptopId}`);this.evaluate(g);
  }
  gamble(g:Game,playerId:string,stake:number,payout:number){this.active(g);need(g.meeting.phase==='idle','MEETING','Gokken is tijdens een meeting gepauzeerd.',409);this.player(g,{kind:'player',playerId},'gambler');stake=positive.parse(stake);payout=int.parse(payout);need(stake<=g.gamblerCash,'FUNDS','Onvoldoende geld op de gedeelde rekening.',409);g.gamblerCash+=payout-stake;this.ledger(g,'gamble',payout-stake,`Inzet ${stake}, uitbetaling ${payout}`);this.evaluate(g);}
  meeting(g:Game,source:'automatic'|'emergency'|'admin'){this.active(g);need(g.meeting.phase==='idle','MEETING_ACTIVE','Er is al een meeting.',409);if(source==='emergency')need(!g.cooldownUntil || this.now()>=g.cooldownUntil,'COOLDOWN','De emergency-knop koelt nog af.',409);
    g.meeting={phase:'gathering',source,startedAt:this.now(),deadline:this.now()+g.config.gatherMs,dismissedId:null};g.nextMeetingAt=null;this.ledger(g,'meeting',0,source);}
  discuss(g:Game){this.active(g);need(g.meeting.phase==='gathering','MEETING_PHASE','Er is geen verzamelfase.',409);g.meeting.phase='discussion';g.meeting.startedAt=this.now();g.meeting.deadline=this.now()+g.config.discussMs;}
  endMeeting(g:Game,at=this.now()){this.active(g);need(g.meeting.phase==='discussion','MEETING_PHASE','Start eerst de overlegfase.',409);g.meeting={phase:'idle',source:null,startedAt:null,deadline:null,dismissedId:null};g.round++;g.players.forEach(p=>p.checks=0);g.nextMeetingAt=at+g.config.autoMeetingMs;g.cooldownUntil=at+g.config.cooldownMs;this.ledger(g,'round',0,`Ronde ${g.round}`);}
  dismiss(g:Game,playerId:string,simulation=false){this.active(g);if(!simulation){need(g.meeting.phase==='discussion','MEETING_PHASE','Ontslag kan alleen tijdens overleg.',409);need(!g.meeting.dismissedId,'DISMISS_LIMIT','Er kan maar één speler per meeting worden ontslagen.',409);}
    const p=g.players.find(p=>p.id===playerId);need(p && !p.dismissed && p.role,'PLAYER','Deze speler kan niet worden ontslagen.',409);p!.dismissed=true;if(!simulation)g.meeting.dismissedId=p!.id;g.lastDismissal={playerId:p!.id,name:p!.name,role:p!.role!,at:this.now()};this.ledger(g,'dismiss',0,p!.name);this.evaluate(g);
  }
  evaluate(g:Game){if(g.phase!=='playing')return;
    if(g.config.gamblerGoal!==null && g.gamblerCash>=g.config.gamblerGoal){this.finish(g,'gamblers','financial-goal');return;}
    const gamblers=g.players.filter(p=>p.role==='gambler');const both=gamblers.length>0 && gamblers.every(p=>p.dismissed);
    if(both && (g.config.workerWin==='dismiss' || (g.config.workerWin==='dismiss-and-finance' && g.companyCash>=100))){this.finish(g,'employees','gamblers-dismissed');return;}
    if(g.companyCash===0 && g.config.zeroCash==='draw'){this.finish(g,'draw','empty-company');return;}
    const assignments=Object.entries(g.assignments).filter(([id])=>!g.players.find(p=>p.id===id)?.dismissed).flatMap(([playerId,ids])=>ids.map(laptopId=>({playerId,laptopId})));
    if(Object.values(g.assignments).some(ids=>ids.length>0) && assignments.every(a=>g.completions.some(c=>c.playerId===a.playerId&&c.laptopId===a.laptopId))){this.finish(g,'draw','tasks-completed');}
  }
  finish(g:Game,winner:Game['winner'],reason:string){g.phase='ended';g.winner=winner;g.endReason=reason;g.nextMeetingAt=null;this.ledger(g,'end',0,reason);}
  command(code:string,a:Actor,id:string,action:string,data:any={}):any {
    const result=this.store.transaction(()=>{let g=this.get(code);const actorKey=JSON.stringify(a);const signature=createHash('sha256').update(JSON.stringify({action,data})).digest('hex');const cached=this.store.cached(g.id,actorKey,id);if(cached!==undefined){need(cached.signature===signature,'REQUEST_CONFLICT','Dit verzoek-ID is al voor een andere actie gebruikt.',409);return {g,result:cached.result,changed:false};}let response:any={ok:true};
      switch(action){
        case 'configure': {this.admin(a);this.lobby(g);const config=configSchema.parse(data.config);need(Object.values(config.roles).reduce((a,b)=>a+b,0)===config.playerCount,'ROLE_COUNT','Het aantal rollen klopt niet.');need(config.playerCount>=g.players.length,'PLAYER_COUNT','Verwijder eerst overtollige spelers.');const roleChange=JSON.stringify(config.roles)!==JSON.stringify(g.config.roles);g.config=config;g.companyCash=config.startCapital;if(roleChange)g.players.forEach(p=>p.role=null);break;}
        case 'locations':this.admin(a);g.config.moneyLaptops=configSchema.shape.moneyLaptops.parse(data.ids);break;
        case 'test-mode':this.admin(a);g.config.testMode=z.boolean().parse(data.enabled);break;
        case 'add-player':this.admin(a);this.lobby(g);response={ok:true,playerId:this.addPlayer(g,data.name).id};break;
        case 'rename-player':{this.admin(a);this.lobby(g);const p=g.players.find(p=>p.id===data.playerId);need(p,'PLAYER','Speler bestaat niet.');const name=nameSchema.parse(data.name);need(!g.players.some(q=>q.id!==p!.id&&q.name.toLowerCase()===name.toLowerCase()),'NAME_TAKEN','Naam bestaat al.');p!.name=name;break;}
        case 'remove-player':{this.admin(a);this.lobby(g);need(g.players.some(p=>p.id===data.playerId),'PLAYER','Speler bestaat niet.');g.players=g.players.filter(p=>p.id!==data.playerId);delete g.assignments[data.playerId];this.store.db.prepare('DELETE FROM credentials WHERE session_id=? AND actor=?').run(g.id,JSON.stringify({kind:'player',playerId:data.playerId}));g.players.forEach(p=>p.role=null);break;}
        case 'recover-player':{this.admin(a);const p=g.players.find(p=>p.id===data.playerId);need(p,'PLAYER','Speler bestaat niet.');this.store.db.prepare('DELETE FROM credentials WHERE session_id=? AND actor=?').run(g.id,JSON.stringify({kind:'player',playerId:p!.id}));p!.claimed=true;response={ok:true,token:this.store.issue({kind:'player',playerId:p!.id},g.id)};break;}
        case 'distribute':this.admin(a);this.distribute(g);break;
        case 'assign':{this.admin(a);this.lobby(g);need(g.players.some(p=>p.id===data.playerId),'PLAYER','Speler bestaat niet.');g.assignments[data.playerId]=z.array(z.number().int().min(1).max(8)).max(8).refine(a=>new Set(a).size===a.length).parse(data.ids);break;}
        case 'rewards':{this.admin(a);this.lobby(g);const rewards=z.array(int.max(100)).length(8).parse(data.rewards);g.tasks.forEach((t,i)=>t.reward=rewards[i]);break;}
        case 'demo':{this.admin(a);this.lobby(g);need([13,14].includes(g.config.playerCount),'DEMO_COUNT','Demodata is voor 13 of 14 spelers.',409);need(g.players.length===0,'DEMO','Demodata kan alleen in een lege lobby.',409);g.config.testMode=true;g.config.gamblerGoal=30;g.config.moneyLaptops=[2,6];['Noor','Sam','Yara','Milan','Lina','Daan','Amir','Tess','Bo','Evi','Finn','Sara','Jules','Maya'].slice(0,g.config.playerCount).forEach(n=>this.addPlayer(g,n));this.distribute(g);g.tasks.forEach(t=>t.reward=3);g.players.forEach((p,i)=>g.assignments[p.id]=p.role==='security'?[i%8+1]:[i%8+1,(i+3)%8+1]);break;}
        case 'start':{this.admin(a);this.lobby(g);need(g.players.length===g.config.playerCount && g.players.every(p=>p.role),'ROLES','Vul de lobby en deel eerst rollen uit.',409);need(g.config.gamblerGoal!==null,'GOAL','Stel het gezamenlijke Gokkersdoel in.',409);need(this.total(g)<=100,'INCOME_LIMIT','Startkapitaal en taakbeloningen mogen samen maximaal 100 zijn.',409);need(Object.values(g.assignments).some(x=>x.length),'ASSIGNMENTS','Wijs eerst taken toe.',409);g.phase='playing';g.round=1;g.companyCash=g.config.startCapital;g.theftUnlocked=g.companyCash>=25;g.nextMeetingAt=this.now()+g.config.autoMeetingMs;this.evaluate(g);break;}
        case 'pause':this.admin(a);this.active(g);g.phase='paused';g.pausedAt=this.now();break;
        case 'resume':{this.admin(a);need(g.phase==='paused','PHASE','Het spel is niet gepauzeerd.',409);const delta=this.now()-g.pausedAt!;this.shift(g,delta);g.phase='playing';g.pausedAt=null;break;}
        case 'end':this.admin(a);need(g.phase!=='ended','PHASE','Het spel is al geëindigd.',409);this.finish(g,'draw','admin-ended');break;
        case 'intro':{const p=this.player(g,a);p.introSeen=true;break;}
        case 'request-meeting': {if(a.kind==='emergency')this.meeting(g,'emergency');else if(a.kind==='admin')this.meeting(g,'admin');else {throw new GameError('FORBIDDEN','Gebruik de gekoppelde emergency-knop.',403);}break;}
        case 'discuss':if(a.kind!=='admin')this.player(g,a,'manager');this.discuss(g);break;
        case 'end-meeting':if(a.kind!=='admin')this.player(g,a,'manager');this.endMeeting(g);break;
        case 'dismiss':if(a.kind!=='admin')this.player(g,a,'manager');this.dismiss(g,z.string().parse(data.playerId));break;
        case 'investigate':{this.active(g);need(g.meeting.phase==='idle','MEETING','Onderzoek is gepauzeerd.',409);const p=this.player(g,a,'security');need(p.checks<2,'CHECK_LIMIT','Je hebt je twee controles deze ronde gebruikt.',409);const laptopId=z.number().int().min(1).max(8).parse(data.laptopId);const times=g.thefts.filter(t=>t.laptopId===laptopId&&t.alerted).map(t=>t.collectedAt);p.checks++;const entry={id:randomUUID(),playerId:p.id,laptopId,at:this.now(),round:g.round,transactionTimes:times};g.investigations.push(entry);response={ok:true,investigation:entry};break;}
        case 'task-proof':{const p=this.player(g,a);const laptopId=z.number().int().min(1).max(8).parse(data.laptopId);const task=g.tasks.find(t=>t.id===laptopId)!;const adapter=taskAdapters.get(task.module);need(adapter,'PLACEHOLDER','De financiële minigame is nog niet gekoppeld.',409);need(adapter!.verify(data.proof,{sessionId:g.id,playerId:p.id,laptopId}),'PROOF','Ongeldig spelbewijs.',403);this.complete(g,p.id,laptopId);break;}
        case 'steal':{this.player(g,a,'gambler');throw new GameError('PLACEHOLDER','De steelminigames zijn nog niet gekoppeld.',409);}
        case 'gamble':{const p=this.player(g,a,'gambler');const adapter=gamblingAdapters.get(data.module);need(adapter,'PLACEHOLDER','Het gokrad is nog niet gekoppeld.',409);const outcome=adapter!.resolve(data.proof);need(outcome,'PROOF','Ongeldig spelbewijs.',403);this.gamble(g,p.id,outcome!.stake,outcome!.payout);break;}
        case 'test-task':this.test(g,a);this.complete(g,z.string().parse(data.playerId),z.number().int().min(1).max(8).parse(data.laptopId));break;
        case 'test-theft':this.test(g,a);this.steal(g,z.string().parse(data.playerId),z.number().int().min(1).max(8).parse(data.laptopId),positive.parse(data.amount));break;
        case 'test-gamble':this.test(g,a);this.gamble(g,z.string().parse(data.playerId),positive.parse(data.stake),int.parse(data.payout));break;
        case 'test-cash':{this.test(g,a);const reserved=g.thefts.filter(t=>!t.debited).reduce((a,t)=>a+t.amount,0);const amount=int.parse(data.amount);need(amount>=reserved,'RESERVED','Dit geld is al voor diefstal gereserveerd.',409);g.companyCash=amount;if(amount>=25)g.theftUnlocked=true;this.ledger(g,'test-company',amount,'Testcorrectie');this.evaluate(g);break;}
        case 'test-pot':this.test(g,a);g.gamblerCash=int.parse(data.amount);this.ledger(g,'test-pot',g.gamblerCash,'Testcorrectie');this.evaluate(g);break;
        case 'test-meeting':this.test(g,a);this.meeting(g,'admin');break;
        case 'test-dismiss':this.test(g,a);this.dismiss(g,z.string().parse(data.playerId),true);break;
        case 'test-evaluate':this.test(g,a);this.evaluate(g);break;
        case 'test-reset':{this.test(g,a);g.phase='lobby';g.companyCash=g.config.startCapital;g.gamblerCash=0;g.completions=[];g.thefts=[];g.investigations=[];g.ledger=[];g.theftUnlocked=false;g.meeting={phase:'idle',source:null,startedAt:null,deadline:null,dismissedId:null};g.round=0;g.nextMeetingAt=null;g.cooldownUntil=null;g.pausedAt=null;g.lastDismissal=null;g.winner=null;g.endReason=null;g.players.forEach(p=>{p.dismissed=false;p.checks=0;p.introSeen=false;});break;}
        default:throw new GameError('ACTION','Onbekende actie.',404);
      }
      g.revision++;this.store.save(g);this.store.cache(g.id,actorKey,id,response,signature);return {g,result:response,changed:true};});
    if(result.changed)this.changed(result.g);return result.result;
  }
  shift(g:Game,ms:number){if(g.nextMeetingAt)g.nextMeetingAt+=ms;if(g.cooldownUntil)g.cooldownUntil+=ms;if(g.meeting.deadline)g.meeting.deadline+=ms;if(g.meeting.startedAt)g.meeting.startedAt+=ms;g.thefts.forEach(t=>{if(!t.debited)t.debitAt+=ms;if(!t.alerted)t.alertAt+=ms;});}
  tick():void {
    for(const stored of this.store.all()) {if(stored.phase==='lobby'||stored.phase==='paused')continue;let dirty=false;
      const g=this.store.transaction(()=>{const g=this.get(stored.id);const now=this.now();for(const t of g.thefts){if(!t.debited&&now>=t.debitAt){g.companyCash-=t.amount;t.debited=true;this.ledger(g,'theft-debit',-t.amount,`Laptop ${t.laptopId}`);dirty=true;}if(!t.alerted&&now>=t.alertAt){t.alerted=true;dirty=true;}}
        if(g.phase==='playing') {if(g.meeting.phase==='discussion'&&now>=g.meeting.deadline!){this.endMeeting(g,g.meeting.deadline!);dirty=true;}
          if(g.meeting.phase==='idle' && g.nextMeetingAt!==null && now>=g.nextMeetingAt){this.meeting(g,'automatic');dirty=true;}
          if(dirty)this.evaluate(g);}
        if(dirty){g.revision++;this.store.save(g);}return g;});if(dirty)this.changed(g);
    }
  }
}
