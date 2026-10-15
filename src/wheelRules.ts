// Sixteen equally likely sectors: 8 total losses, 2 half losses, 2 small wins,
// 3 doubles and 1 jackpot. Even the smallest stake has expected payout below its cost.
export const WHEEL = [
 {label:'×2',factor:2,bonus:0},{label:'+€1',factor:1,bonus:1},
 {label:'×0',factor:0,bonus:0},{label:'½',factor:.5,bonus:0},
 {label:'×0',factor:0,bonus:0},{label:'×2',factor:2,bonus:0},
 {label:'+€1',factor:1,bonus:1},{label:'×0',factor:0,bonus:0},
 {label:'½',factor:.5,bonus:0},{label:'×0',factor:0,bonus:0},
 {label:'×4',factor:4,bonus:0},{label:'×0',factor:0,bonus:0},
 {label:'×0',factor:0,bonus:0},{label:'×0',factor:0,bonus:0},
 {label:'×2',factor:2,bonus:0},{label:'×0',factor:0,bonus:0},
] as const;
export function wheelPayout(segment:number,stake:number){const s=WHEEL[segment];return Math.floor(stake*s.factor+s.bonus);}
