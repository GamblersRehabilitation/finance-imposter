import {randomUUID} from 'node:crypto';
import type {Engine} from '../server/engine';
/** Small explicit euro values keep accounting assertions readable; normal games use scaled defaults. */
export function smallEconomy(engine:Engine,code:string){const g=engine.get(code);engine.command(code,{kind:'admin'},randomUUID(),'configure',{config:{...g.config,autoEconomy:false,startCapital:10,companyGoal:100,gamblerGoal:30,theftAmount:3}});engine.command(code,{kind:'admin'},randomUUID(),'rewards',{rewards:Array(8).fill(3)});}
export const smallConfig=(config:any)=>({...config,autoEconomy:false,startCapital:10,companyGoal:100,gamblerGoal:30,theftAmount:3});
