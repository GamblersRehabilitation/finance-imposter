import {useEffect} from 'react';
const labels:Record<string,string>={overview:'Overzicht',players:'Spelers & rollen',tasks:'Opdrachten',config:'Spelinstellingen',devices:'Apparaten',test:'Testomgeving',phone:'Telefoon',board:'Digibord',emergency:'Meeting',manager:'Manager',security:'Beveiliger',gambler:'Gokker',employee:'Werknemer'};
export function usePageIdentity(kind:string,title?:string){
 useEffect(()=>{document.title=`${title??labels[kind]??'Terminal'} · Gamblers Addiction`;let icon=document.querySelector<HTMLLinkElement>('link[rel="icon"]');if(!icon){icon=document.createElement('link');icon.rel='icon';document.head.append(icon);}icon.type='image/svg+xml';icon.href=`/icons/${kind}.svg`;},[kind,title]);
}
