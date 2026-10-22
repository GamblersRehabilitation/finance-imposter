import {afterEach,beforeEach,expect,it,vi} from 'vitest';

let allowed=false;
let contexts:FakeAudioContext[]=[];
let preferences:Map<string,string>;
class FakeAudioContext {
  state='suspended';currentTime=100;destination={};notes:any[]=[];gains:any[]=[];
  constructor(){contexts.push(this);}
  resume=vi.fn(async()=>{if(allowed)this.state='running';});
  createOscillator(){const note={frequency:{value:0},connect:vi.fn(),start:vi.fn(),stop:vi.fn()};this.notes.push(note);return note;}
  createGain(){const gain={gain:{setValueAtTime:vi.fn(),exponentialRampToValueAtTime:vi.fn()},connect:vi.fn()};this.gains.push(gain);return gain;}
}
beforeEach(()=>{allowed=false;contexts=[];preferences=new Map();vi.resetModules();vi.stubGlobal('AudioContext',FakeAudioContext);vi.stubGlobal('localStorage',{getItem:(key:string)=>preferences.get(key)??null});});
afterEach(()=>vi.unstubAllGlobals());

it('laat een geblokkeerde melding vervallen en speelt geen oude geluiden bij de eerste tik',async()=>{
  const {cue,unlockSound}=await import('../src/feedback');cue('alert');
  expect(contexts[0].notes).toHaveLength(0);
  allowed=true;unlockSound();await Promise.resolve();expect(contexts[0].notes).toHaveLength(0);
  cue('alert');expect(contexts[0].notes.map(note=>note.frequency.value)).toEqual([660,440,660]);
});
it('houdt dezelfde actieve audiocontext beschikbaar voor latere meetingmeldingen',async()=>{
  const {cue,unlockSound}=await import('../src/feedback');allowed=true;unlockSound();cue('tap');cue('alert');
  expect(contexts).toHaveLength(1);expect(contexts[0].notes).toHaveLength(4);
  expect(contexts[0].notes[3].start).toHaveBeenCalledWith(100.22);
});
it('respecteert dempen en hervat geluid wanneer de speler het weer aanzet',async()=>{
  const {cue,unlockSound}=await import('../src/feedback');allowed=true;unlockSound();
  preferences.set('fi-sound','off');cue('alert');expect(contexts[0].notes).toHaveLength(0);
  preferences.set('fi-sound','on');cue('success');expect(contexts[0].notes).toHaveLength(3);
});

it('maakt de openbare meetingbel harder en langer dan gewone knopfeedback',async()=>{const {cue,unlockSound}=await import('../src/feedback');allowed=true;unlockSound();cue('tap');cue('meeting');expect(contexts[0].notes).toHaveLength(7);expect(contexts[0].gains[0].gain.setValueAtTime).toHaveBeenCalledWith(.035,100);expect(contexts[0].gains[1].gain.setValueAtTime).toHaveBeenCalledWith(.24,100);expect(contexts[0].notes.at(-1).stop.mock.calls[0][0]).toBeCloseTo(101.07);});
it('geeft kiezen, bevestigen, teruggaan en draaien verschillende korte tonen zonder spraak',async()=>{const {cue,unlockSound}=await import('../src/feedback');allowed=true;unlockSound();cue('select');cue('confirm');cue('back');cue('turn');expect(contexts[0].notes.map(n=>n.frequency.value)).toEqual([440,440,660,440,330,300,350]);});
