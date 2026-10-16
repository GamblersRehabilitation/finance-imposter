import {randomInt} from 'node:crypto';
import type {Puzzle} from './types.js';
export const financialTasks=[['calculator','Begroting'],['receipt','Factuurcontrole'],['exchange','Valuta wisselen'],['piggy','Spaarrente'],['shield','Verzekeren'],['banknotes','Kascontrole'],['chart','Winst berekenen'],['portfolio','Portefeuille verdelen']] as const;
const odd=(min:number,max:number)=>randomInt(min,max)*2+1;
export function makePuzzle(laptopId:number):Puzzle{
 let title='',expression='',answer=0,instruction='',details:Puzzle['details']={};
 switch(laptopId){
 case 1:{const cost=randomInt(31,95),missing=odd(8,35),income=cost+missing;title='Begroting';expression=`€${income} inkomsten − €${cost} vaste kosten − ? = €0`;answer=missing;details={income,cost};instruction='Vul de ontbrekende kosten aan. Inkomsten en uitgaven moeten gelijk zijn.';break;}
 case 2:{const quantity=randomInt(3,8),unitPrice=odd(6,29),shipping=odd(1,8);title='Factuurcontrole';answer=quantity*unitPrice+shipping;expression=`${quantity} dossiers × €${unitPrice} + €${shipping} verzending = ?`;details={quantity,unitPrice,shipping};instruction='Controleer aantal × prijs, plus verzending. Keur alleen het juiste totaal goed.';break;}
 case 3:{const rateFrom=randomInt(2,5),rateTo=rateFrom+2,units=odd(3,13),euros=rateFrom*units;title='Valuta wisselen';answer=rateTo*units;expression=`€${rateFrom} → $${rateTo}; €${euros} → $ ?`;details={rateFrom,rateTo,euros};instruction='Gebruik de koersverhouding. Deel eerst door het eurobedrag van de koers, vermenigvuldig daarna.';break;}
 case 4:{const principal=randomInt(3,12)*100,rate=[3,5,7,9][randomInt(4)],fee=odd(1,5);title='Spaarrente';answer=principal+principal*rate/100-fee;expression=`€${principal} + ${rate}% jaarrente − €${fee} kosten = € ?`;details={principal,rate,fee};instruction='Bereken één jaar rente en trek daarna de rekeningkosten af. Gebruik hele euro’s.';break;}
 case 5:{const damage=odd(32,100),excess=[13,15,17,23,25][randomInt(5)],limit=damage;title='Verzekeren';answer=damage-excess;expression=`Schade €${damage} − eigen risico €${excess} = € ?`;details={damage,excess,limit};instruction='Eigen risico betaal je zelf. Kies wat de verzekeraar betaalt: schade min eigen risico.';break;}
 case 6:{const denominations=[20,10,5,2,1],counts=[randomInt(1,4),randomInt(1,5),odd(0,3),randomInt(1,5),randomInt(3)*2];title='Kascontrole';answer=denominations.reduce((sum,n,i)=>sum+n*counts[i],0);expression=denominations.map((n,i)=>`${counts[i]} × €${n}`).join(' + ');details={denominations,counts};instruction='Tel biljetten én munten. Vul per vak het aantal in en verzegel het totaal.';break;}
 case 7:{const costs=[odd(30,75),odd(12,35),odd(3,18)],profit=odd(9,49),revenue=costs.reduce((n,x)=>n+x,0)+profit;title='Winst berekenen';answer=profit;expression=`€${revenue} omzet − ${costs.map(n=>`€${n}`).join(' − ')} kosten = € ?`;details={revenue,costs};instruction='Trek salaris, huur en overige kosten van de omzet af. Boek de resterende winst.';break;}
 default:{const total=randomInt(3,12)*100,bondPercent=[35,45,55,65,75][randomInt(5)];title='Portefeuille verdelen';answer=total*bondPercent/100;expression=`€${total} vermogen; ${bondPercent}% obligaties, ${100-bondPercent}% aandelen`;details={total,bondPercent};instruction='Bereken het obligatiebedrag uit het totale vermogen en de doelverdeling.';}
 }
 const alternatives=new Set([answer]);while(alternatives.size<4){const n=answer+[3,-3,5,-5,7,-7][randomInt(6)];if(n>=0)alternatives.add(n);}
 const choices=[...alternatives];for(let i=choices.length-1;i>0;i--){const j=randomInt(i+1);[choices[i],choices[j]]=[choices[j],choices[i]];}
 return {title,expression,answer,choices,kind:['budget','invoice','exchange','saving','claim','cash','profit','portfolio'][laptopId-1],instruction,details};
}
