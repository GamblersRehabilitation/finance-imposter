import {randomInt} from 'node:crypto';
import {makePuzzle} from './puzzles.js';
import type {Puzzle} from './types.js';
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
];
export function makeTaskStage(laptopId:number,stage:number):Puzzle{
 if(stage===0)return makePuzzle(laptopId);
 const c=contexts[laptopId-1];
 if(stage===1){const answer=randomInt(3),documents=c.records.map((label,i)=>{const expected=randomInt(8,43)*2+1;return {label,expected,actual:expected+(i===answer?[3,5,7][randomInt(3)]:0)};});return {title:`${c.name} · documentcontrole`,expression:'Zoek het afwijkende dossier.',kind:'review',instruction:'Vergelijk de twee bedragen op elke kaart. Kies het dossier waarin ze verschillen.',choices:[0,1,2],answer,review:{expectedLabel:c.expected,actualLabel:c.actual,documents}};}
 const amounts=new Set<number>();while(amounts.size<3)amounts.add(randomInt(9,45)*2+1);
 const values=[...amounts],order=[0,1,2];for(let i=2;i>0;i--){const j=randomInt(i+1);[order[i],order[j]]=[order[j],order[i]];}
 return {title:`${c.name} · boekingen koppelen`,kind:'matching',expression:'Koppel elke betaling aan het juiste bedrag.',instruction:'Klik links een betaling en rechts het bijbehorende dossier met hetzelfde bedrag. Maak drie koppelingen.',choices:[],answer:0,matching:{items:c.items.map((label,i)=>({label,amount:values[i]})),accounts:order.map(i=>({label:c.accounts[i],amount:values[i]})),solution:values.map((_,i)=>order.indexOf(i))}};
}
