// 16 equal sectors: exactly 8 profits and 8 losses, with partial refunds on losses.
export const WHEEL=[
 {label:'×2',factor:2,bonus:0},{label:'×2',factor:2,bonus:0},
 {label:'¼',factor:.25,bonus:0},{label:'½',factor:.5,bonus:0},
 {label:'¼',factor:.25,bonus:0},{label:'×3',factor:3,bonus:0},
 {label:'×2',factor:2,bonus:0},{label:'½',factor:.5,bonus:0},
 {label:'½',factor:.5,bonus:0},{label:'¼',factor:.25,bonus:0},
 {label:'×3',factor:3,bonus:0},{label:'½',factor:.5,bonus:0},
 {label:'×2',factor:2,bonus:0},{label:'¼',factor:.25,bonus:0},
 {label:'×3',factor:3,bonus:0},{label:'×2',factor:2,bonus:0},
] as const;
export function wheelPayout(segment:number,stake:number){const s=WHEEL[segment];return Math.ceil(stake*s.factor);}
