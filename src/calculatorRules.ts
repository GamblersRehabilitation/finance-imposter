/** Small arithmetic parser. No eval, functions or access to the page. */
export function calculate(expression:string):number {
 if(expression.length>120)throw Error('Berekening te lang');
 const source=expression.replaceAll(',','.').replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-').replace(/\s/g,'');
 const tokens=source.match(/\d*\.?\d+|[()+\-*/%]/g)??[];
 if(tokens.join('')!==source||!tokens.length)throw Error('Controleer de berekening');
 let i=0;
 function value():number{let n:number;const token=tokens[i++];if(token==='+'||token==='-')n=(token==='-'?-1:1)*value();else if(token==='('){n=sum();if(tokens[i++]!==')')throw Error('Haakje ontbreekt');}else{if(!token||!/^[\d.]+$/.test(token))throw Error('Getal ontbreekt');n=Number(token);}while(tokens[i]==='%'){i++;n/=100;}return n;}
 function product(){let n=value();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++],right=value();if(op==='/'&&right===0)throw Error('Delen door nul kan niet');n=op==='*'?n*right:n/right;}return n;}
 function sum(){let n=product();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],right=product();n=op==='+'?n+right:n-right;}return n;}
 const result=sum();if(i!==tokens.length||!Number.isFinite(result)||Math.abs(result)>1e12)throw Error('Controleer de berekening');return Number(result.toPrecision(12));
}
