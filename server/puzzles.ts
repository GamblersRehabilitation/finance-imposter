import { randomInt } from 'node:crypto';
import type { Puzzle } from './types.js';

export const financialTasks=[
  ['calculator','Begroting'],['receipt','Factuurcontrole'],['coins','Valuta wisselen'],['piggy','Spaarrente'],
  ['shield','Verzekeren'],['coins','Kascontrole'],['briefcase','Winst berekenen'],['scale','Portefeuille verdelen'],
] as const;

/** Fresh figures per attempt. Only the terminal receives the question; the answer stays on the server. */
export function makePuzzle(laptopId:number):Puzzle {
  const a=randomInt(4,10)*10,b=randomInt(2,4)*10;
  let title='',expression='',answer=0;
  switch(laptopId){
    case 1:title='Begroting';expression=`+ €${a+b} − €${a} − ? = €0`;answer=b;break;
    case 2:title='Factuurcontrole';expression=`${b/10} × €${a} + €${b} = ?`;answer=b/10*a+b;break;
    case 3:title='Valuta wisselen';expression=`€1 → $2     €${a} → $ ?`;answer=a*2;break;
    case 4:title='Spaarrente';expression=`€${a*10} + 10% = € ?`;answer=a*11;break;
    case 5:title='Verzekeren';expression=`€${a*10} − €${b} eigen risico = € ?`;answer=a*10-b;break;
    case 6:title='Kascontrole';expression=`${b/10} × €10 + ${a/10} × €5 = € ?`;answer=b+a/2;break;
    case 7:title='Winst berekenen';expression=`€${a+b} omzet − €${a} kosten = € ?`;answer=b;break;
    default:title='Portefeuille verdelen';expression=`€${a*10} totaal: 30% aandelen + 70% obligaties = € ? obligaties`;answer=a*7;
  }
  const choices=[answer,answer+10,Math.max(0,answer-10),answer+20];
  for(let i=choices.length-1;i>0;i--){const j=randomInt(i+1);[choices[i],choices[j]]=[choices[j],choices[i]];}
  return {title,expression,choices,answer};
}
