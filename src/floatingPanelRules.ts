export type PanelPoint={x:number;y:number};
export function clampPanelPosition(point:PanelPoint,size:{width:number;height:number},viewport:{width:number;height:number}):PanelPoint{return {x:Math.max(8,Math.min(point.x,viewport.width-size.width-8)),y:Math.max(8,Math.min(point.y,viewport.height-size.height-8))};}
