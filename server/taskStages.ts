import {randomInt} from 'node:crypto';
import {makePuzzle} from './puzzles.js';
import type {Puzzle} from './types.js';
import {ACTIVE_FINANCE_MODES,type FinanceDeck} from '../src/financeModes.js';
import {makeInteractiveFinance} from '../src/interactiveFinanceRules.js';
export const TASK_PARTS=3;
export const taskProgressKey=(playerId:string,laptopId:number)=>`${playerId}:${laptopId}`;
const contexts=[
 {name:'Begroting',records:['Marketing','Inkoop','Personeel'],expected:'Budget',actual:'Aanvraag',items:['Inkoopbetaling','Salarisbetaling','Campagnebetaling'],accounts:['Inkooprekening','Salarisrekening','Marketingrekening']},
 {name:'Factuurcontrole',records:['Factuur A','Factuur B','Factuur C'],expected:'Bestelling',actual:'Factuur',items:['Betaling Bakker','Betaling Smit','Betaling Vos'],accounts:['Factuur 104','Factuur 208','Factuur 315']},
 {name:'Valuta wisselen',records:['Wisselorder A','Wisselorder B','Wisselorder C'],expected:'Bevestigd',actual:'Bijgeschreven',items:['Wisselbetaling A','Wisselbetaling B','Wisselbetaling C'],accounts:['Valutarekening 03','Valutarekening 07','Valutarekening 11']},
 {name:'Spaarrente',records:['Spaardossier A','Spaardossier B','Spaardossier C'],expected:'Bankafschrift',actual:'Geboekt',items:['Rentebetaling A','Rentebetaling B','Rentebetaling C'],accounts:['Spaarrekening 03','Spaarrekening 07','Spaarrekening 11']},
 {name:'Verzekeren',records:['Schadedossier A','Schadedossier B','Schadedossier C'],expected:'Goedgekeurd',actual:'Aangevraagd',items:['Uitkering Iris','Uitkering Noor','Uitkering Sam'],accounts:['Polis 104','Polis 208','Polis 315']},
 {name:'Kascontrole',records:['Kassa A','Kassa B','Kassa C'],expected:'Geteld',actual:'Kasboek',items:['Kasstorting A','Kasstorting B','Kasstorting C'],accounts:['Dagstaat 03','Dagstaat 07','Dagstaat 11']},
 {name:'Winst berekenen',records:['Afdeling A','Afdeling B','Afdeling C'],expected:'Brondocument',actual:'Grootboek',items:['Verkoopbetaling','Leveranciersbetaling','Huurbetaling'],accounts:['Boeking 104','Boeking 208','Boeking 315']},
 {name:'Portefeuille verdelen',records:['Order A','Order B','Order C'],expected:'Opdracht',actual:'Uitgevoerd',items:['Belegging Iris','Belegging Noor','Belegging Sam'],accounts:['Portefeuille 03','Portefeuille 07','Portefeuille 11']},
 {name:'Salariscontrole',records:['Loonstrook A','Loonstrook B','Loonstrook C'],expected:'Nettoloon',actual:'Betaalopdracht',items:['Loon Iris','Loon Noor','Loon Sam'],accounts:['Personeel 03','Personeel 07','Personeel 11']},
 {name:'Btw boeken',records:['Btw-dossier A','Btw-dossier B','Btw-dossier C'],expected:'Factuur',actual:'Geboekt',items:['Btw-betaling A','Btw-betaling B','Btw-betaling C'],accounts:['Aangifte 104','Aangifte 208','Aangifte 315']},
 {name:'Dubbele betalingen',records:['Betaalbatch A','Betaalbatch B','Betaalbatch C'],expected:'Opdracht',actual:'Uitgevoerd',items:['Leverancier Iris','Leverancier Noor','Leverancier Sam'],accounts:['Leveranciersrekening 03','Leveranciersrekening 07','Leveranciersrekening 11']},
 {name:'Betaalvolgorde',records:['Vervallen factuur A','Vervallen factuur B','Vervallen factuur C'],expected:'Te voldoen',actual:'Betaald',items:['Spoedbetaling A','Spoedbetaling B','Spoedbetaling C'],accounts:['Factuur 104','Factuur 208','Factuur 315']},
];
export function makeTaskSequence(first:number,choose:(max:number)=>number=randomInt):number[]{
 const pool=ACTIVE_FINANCE_MODES.filter(id=>id!==first);
 for(let i=pool.length-1;i>0;i--){const j=choose(i+1);[pool[i],pool[j]]=[pool[j],pool[i]];}
 return [first,...pool.slice(0,2)];
}
/** Deal without replacement. Persist the bag, including reservations for unfinished tasks. */
export function drawTaskSequence(deck:FinanceDeck,choose:(max:number)=>number=randomInt):number[]{
 const sequence:number[]=[];deck.remaining=deck.remaining.filter(id=>ACTIVE_FINANCE_MODES.includes(id));
 for(let slot=0;slot<3;slot++){
  if(!deck.remaining.length){deck.remaining=[...ACTIVE_FINANCE_MODES];for(let i=deck.remaining.length-1;i>0;i--){const j=choose(i+1);[deck.remaining[i],deck.remaining[j]]=[deck.remaining[j],deck.remaining[i]];}}
  const candidates=deck.remaining.filter(id=>!sequence.includes(id));
  const pick=candidates.find(id=>id!==deck.last.at(-1))??candidates[0];
  // A full bag always has enough distinct entries, including at the bag boundary.
  sequence.push(pick);deck.remaining.splice(deck.remaining.indexOf(pick),1);
 }
 deck.last=sequence;return sequence;
}
export function makeTaskStage(laptopId:number,stage:number,sequence?:number[]):Puzzle{
 if(sequence){const mode=sequence[stage];
  if(mode<=10)return makePuzzle(mode);
  const interactive=makeInteractiveFinance(mode,randomInt);if(interactive)return interactive;
  if(mode<=12)return makePuzzle(mode);
  if(mode===13||mode===14)return makeTaskStage(laptopId,mode-12);
  if(mode===15){const amounts=[7,13,23,47],mask=randomInt(1,15),target=amounts.reduce((sum,n,i)=>sum+((mask>>i)&1)*n,0);return {kind:'reserve',title:'Betaalbatch samenstellen',expression:'',choices:[],answer:mask,details:{amounts,target}};}
  if(mode===16){const days=[1,3,5];for(let i=2;i>0;i--){const j=randomInt(i+1);[days[i],days[j]]=[days[j],days[i]];}const order=[0,1,2].sort((a,b)=>days[a]-days[b]);return {kind:'order',title:'Betaalkalender',expression:'',choices:[],answer:order.reduce((n,i)=>n*3+i,0),details:{days}};}
  throw new Error('Onbekend financieel onderdeel');
 }
 if(stage===0)return makePuzzle(laptopId);
 const c=contexts[laptopId-1];
 if(stage===1){const answer=randomInt(3),documents=c.records.map((label,i)=>{const expected=randomInt(8,43)*2+1;return {label,expected,actual:expected+(i===answer?[3,5,7][randomInt(3)]:0)};});return {title:`${c.name} · documentcontrole`,expression:'Zoek het afwijkende dossier.',kind:'review',instruction:'Vergelijk de twee bedragen op elke kaart. Kies het dossier waarin ze verschillen.',choices:[0,1,2],answer,review:{expectedLabel:c.expected,actualLabel:c.actual,documents}};}
 const amounts=new Set<number>();while(amounts.size<3)amounts.add(randomInt(9,45)*2+1);
 const values=[...amounts],order=[0,1,2];for(let i=2;i>0;i--){const j=randomInt(i+1);[order[i],order[j]]=[order[j],order[i]];}
 return {title:`${c.name} · boekingen koppelen`,kind:'matching',expression:'Koppel elke betaling aan het juiste bedrag.',instruction:'Klik links een betaling en rechts het bijbehorende dossier met hetzelfde bedrag. Maak drie koppelingen.',choices:[],answer:0,matching:{items:c.items.map((label,i)=>({label,amount:values[i]})),accounts:order.map(i=>({label:c.accounts[i],amount:values[i]})),solution:values.map((_,i)=>order.indexOf(i))}};
}
