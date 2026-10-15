import React from 'react';
import {createRoot} from 'react-dom/client';
import { Admin } from './Admin';
import { PlayerApp } from './Player';
import { Device } from './Device';
import './styles.css';
class Boundary extends React.Component<{children:React.ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?<main className="fatal"><h1>Gamblers Addiction</h1><p>Het scherm kon niet worden geladen.</p><button className="btn" onClick={()=>location.reload()}>Opnieuw laden</button></main>:this.props.children;}}
function App(){const parts=location.pathname.split('/').filter(Boolean);if(parts[0]==='play'&&parts[1])return <PlayerApp code={parts[1]}/>;if(['laptop','board','emergency'].includes(parts[0])&&parts[1])return <Device kind={parts[0]} code={parts[1]} laptopId={Number(parts[2])||undefined}/>;return <Admin/>;}
createRoot(document.getElementById('root')!).render(<Boundary><App/></Boundary>);
