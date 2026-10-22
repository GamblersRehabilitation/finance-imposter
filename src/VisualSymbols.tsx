import {Check,Circle,Diamond,Hand,Hexagon,Square,Star,Triangle} from 'lucide-react';
import {Icon} from './ui';
import {financeModeIcons} from './financeModes';
import {cue} from './feedback';

export const shapeNames=['Cirkel','Driehoek','Vierkant','Ruit','Ster','Zeshoek'];
const shapes=[Circle,Triangle,Square,Diamond,Star,Hexagon];
export function ShapeGlyph({digit}:{digit:string}){const Shape=shapes[Number(digit)]??Circle;return <Shape aria-hidden="true"/>;}
export function ShapeRow({value,slots=4}:{value:string;slots?:number}){return <div className="visual-shapes" aria-label={`${value.length} van ${slots} vormen`}>{Array.from({length:slots},(_,i)=><span key={i}>{value[i]!==undefined&&<ShapeGlyph digit={value[i]}/>}</span>)}</div>;}
export function ShapeKeys({onPress,disabled,highlight}:{onPress:(digit:string)=>void;disabled:boolean;highlight?:string}){return <div className="code-keypad visual-keypad">{shapes.map((Shape,i)=><button key={i} aria-label={shapeNames[i]} disabled={disabled} className={highlight===String(i)?'ghost-target':''} onClick={()=>(cue('select'),onPress(String(i)))}><Shape size={30}/>{highlight===String(i)&&<Hand className="demo-hand"/>}</button>)}</div>;}

export {PairingLesson} from './PairingLesson';

export function VisualParts({stage,gameId=1,sequence=[gameId,13,14]}:{stage:number;gameId?:number;sequence?:number[]}){return <ol className="visual-parts" aria-label={`Onderdeel ${stage+1} van 3`}>{sequence.map((mode,i)=><li key={i} aria-current={i===stage?'step':undefined} className={i<stage?'finished':i===stage?'current':''}>{i<stage?<Check/>:<Icon name={financeModeIcons[mode-1]??'scale'}/>}<span>{i+1}</span></li>)}</ol>;}
