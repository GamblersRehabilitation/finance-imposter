export type ScanEntry={id:string;laptopId:number;at:number;transactionTimes:number[];failures?:number[];round?:number};
export function scanOutcome(scan:ScanEntry){return scan.transactionTimes.length?'money':scan.failures?.length?'failure':'clear';}
export function scanEvents(scan:ScanEntry){return [...scan.transactionTimes.map(at=>({kind:'money' as const,at})),...(scan.failures??[]).map(at=>({kind:'failure' as const,at}))].sort((a,b)=>b.at-a.at);}
export function timestamp(at:number){return new Intl.DateTimeFormat('nl-NL',{timeZone:'Europe/Amsterdam',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(at);}
