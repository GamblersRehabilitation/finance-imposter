// Public identifiers and symbols only; answers are generated on the server.
export const financeModeIcons=['scale','receipt','exchange','piggy','shield','banknotes','chart','portfolio','payroll','vat','duplicate','priority','receipt','exchange','banknotes','priority','receipt','shield','banknotes','shield'];
export const FINANCE_MODE_COUNT=financeModeIcons.length;
export const calculationModes=new Set([1,5,7,15]);
export const financeFamily=(id:number)=>calculationModes.has(id)?'calculation':[2,20].includes(id)?'approve':[3,4,8,10,14].includes(id)?'route':[9,11,13,18].includes(id)?'inspect':[12,16,17].includes(id)?'order':`mode-${id}`;
export type FinanceDeck={remaining:number[];last:number[]};
