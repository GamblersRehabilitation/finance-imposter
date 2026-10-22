// Shared visual rules. The server supplies crypto randomness; tutorials use a fixed seed.
export const INTERACTIVE_FINANCE_MODES=[2,3,4,8,9,10,17,18,19,20];
export const interactiveKinds=new Set(['approval','currency-route','maturity-file','risk-route','identity','tax-file','workflow','beneficiary','watermark','coverage']);
export const packChoices=(choices:number[],base=3)=>choices.reduce((n,i)=>n*base+i,0);
export function unpackChoices(value:number,length:number,base=3){return Array.from({length},(_,i)=>Math.floor(value/base**(length-i-1))%base);}
export function makeInteractiveFinance(mode:number,roll:(max:number)=>number):any|null{
 const shuffle=(values:number[])=>{for(let i=values.length-1;i>0;i--){const j=roll(i+1);[values[i],values[j]]=[values[j],values[i]];}return values;};
 const puzzle=(kind:string,details:Record<string,number|number[]>,answer:number)=>({kind,title:kind,expression:'',choices:[],details,answer});
 if(mode===2){const marks=shuffle([0,1,2,3]);return puzzle('approval',{marks},marks.reduce((n,m,i)=>n+(m===3?1<<i:0),0));}
 if([3,4,8,10].includes(mode)){const values=shuffle(mode===3?[0,1,0,1]:[0,1,2]),kind=({3:'currency-route',4:'maturity-file',8:'risk-route',10:'tax-file'} as Record<number,string>)[mode];return puzzle(kind,{values,categories:mode===3?[0,1]:[0,1,2]},packChoices(values));}
 if(mode===9){const ids=shuffle([113,337,559,773]),bad=roll(4),documents=ids.map((n,i)=>i===bad?n+2:n);return puzzle('identity',{ids,documents},bad);}
 if(mode===17){const values=shuffle([0,1,2,3]),order=[0,1,2,3].map(step=>values.indexOf(step));return puzzle('workflow',{values},packChoices(order,4));}
 if(mode===18){const trusted=shuffle([113,337,559]),payments=shuffle([...trusted,779]);return puzzle('beneficiary',{trusted,payments},payments.indexOf(779));}
 if(mode===19){const marks=shuffle([1,1,0,1]),serials=shuffle([1013,3037,5059,7073]);return puzzle('watermark',{marks,serials},marks.indexOf(0));}
 if(mode===20){const policy=shuffle([0,1,2,3]).slice(0,2),claims=shuffle([0,1,2,3]);return puzzle('coverage',{policy,claims},claims.reduce((n,v,i)=>n+(policy.includes(v)?1<<i:0),0));}
 return null;
}
export function interactivePractice(mode:number,demo:boolean){let seed=demo?173:420;return makeInteractiveFinance(mode,max=>{seed=(seed*1664525+1013904223)>>>0;return seed%max;});}
