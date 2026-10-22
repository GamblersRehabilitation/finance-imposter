// 16 equal sectors: exactly 8 profits and 8 losses. One jackpot sector.
export const WHEEL=[
 {label:'×2',factor:2,bonus:0},{label:'+10%',factor:1.1,bonus:0},
 {label:'×0',factor:0,bonus:0},{label:'½',factor:.5,bonus:0},
 {label:'×0',factor:0,bonus:0},{label:'+50%',factor:1.5,bonus:0},
 {label:'+10%',factor:1.1,bonus:0},{label:'×0',factor:0,bonus:0},
 {label:'½',factor:.5,bonus:0},{label:'×0',factor:0,bonus:0},
 {label:'×4',factor:4,bonus:0},{label:'×0',factor:0,bonus:0},
 {label:'+10%',factor:1.1,bonus:0},{label:'×0',factor:0,bonus:0},
 {label:'+50%',factor:1.5,bonus:0},{label:'+10%',factor:1.1,bonus:0},
] as const;
export function wheelPayout(segment:number,stake:number){const s=WHEEL[segment];return s.factor>1?Math.ceil(stake*Math.round(s.factor*100)/100):Math.floor(stake*s.factor);}
