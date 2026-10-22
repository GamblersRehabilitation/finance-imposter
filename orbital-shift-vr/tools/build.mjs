import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(base,'build'); fs.mkdirSync(out,{recursive:true});
const modules=[];
for(const [dir,target] of [['shared','ReplicatedStorage.OrbitalShiftVR.Shared'],['server','ServerScriptService.OrbitalShiftVR'],['client','StarterPlayer.StarterPlayerScripts.OrbitalShiftVR']]){
  for(const name of fs.readdirSync(path.join(base,'src',dir)).filter(x=>x.endsWith('.luau')).sort()){
    const source=fs.readFileSync(path.join(base,'src',dir,name),'utf8');
    const className=name.endsWith('.server.luau')?'Script':name.endsWith('.client.luau')?'LocalScript':'ModuleScript';
    modules.push({path:target,name:name.replace(/\.(server|client)\.luau$|\.luau$/,''),className,source,file:`src/${dir}/${name}`});
  }
}
const quote=s=>{let eq='==';while(s.includes(']'+eq+']'))eq+='=';return '['+eq+'['+s+']'+eq+']'};
const prelude=`-- ORBITAL SHIFT VR: namespace-only, repeatable source installer. Run in EDIT mode of an EMPTY place.\nassert(not game:GetService('RunService'):IsRunning(),'Stop Play before installing')\nassert(game.PlaceId==0 or game:GetAttribute('OrbitalShiftProject'),'Use an unsaved empty place or the explicitly approved Orbital Shift place')\nlocal function folder(parent,name) local f=parent:FindFirstChild(name); if not f then f=Instance.new('Folder'); f.Name=name; f.Parent=parent end; return f end\nlocal function put(service,names,name,class,source) local f=game:GetService(service); for _,n in names do f=folder(f,n) end; local s=f:FindFirstChild(name); if s and s.ClassName~=class then error('Conflicting class: '..name) end; if not s then s=Instance.new(class); s.Name=name end; s.Source=source; s.Parent=f end\n`;
const chunks=[];
let current=prelude;
for(const m of modules){
  const [service,...folders]=m.path.split('.');
  const line=`put(${quote(service)},{${folders.map(quote).join(',')}},${quote(m.name)},${quote(m.className)},${quote(m.source)})\n`;
  if(current.length+line.length>24000&&current!==prelude){chunks.push(current);current=prelude;}
  current+=line;
}
chunks.push(current);
const finish=`workspace.Gravity=0\ngame.Name='Orbital Shift VR'\ngame:SetAttribute('OrbitalShiftProject',true)\nlocal old=workspace:FindFirstChild('OrbitalShiftVR'); if old then old:Destroy() end\nlocal builder=game.ServerScriptService.OrbitalShiftVR.WorldBuilder:Clone(); builder.Parent=game.ServerScriptService.OrbitalShiftVR\nlocal ok,result=pcall(function() return require(builder).build(workspace:GetAttribute('OSTrainingOnly')==true) end); builder:Destroy(); assert(ok,result)\nreturn 'Orbital Shift VR installed'`;
fs.writeFileSync(path.join(out,'Install.command.luau'),chunks.join('\n')+'\n'+finish);
fs.writeFileSync(path.join(out,'mcp-chunks.json'),JSON.stringify([...chunks,finish]));
const escape=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const nameProp=n=>`<string name="Name">${escape(n)}</string>`;
const item=(cls,name,children='',props='')=>`<Item class="${cls}"><Properties>${nameProp(name)}${props}</Properties>${children}</Item>`;
const script=m=>item(m.className,m.name,'',`<ProtectedString name="Source">${escape(m.source)}</ProtectedString>`);
const scripts=dir=>modules.filter(m=>m.file.startsWith('src/'+dir+'/')).map(script).join('');
const color=(name,c)=>`<Color3 name="${name}"><R>${c[0]}</R><G>${c[1]}</G><B>${c[2]}</B></Color3>`;
const previewPath=path.join(out,'world-preview.json');
let preview='';
if(fs.existsSync(previewPath)){
  const data=JSON.parse(fs.readFileSync(previewPath,'utf8'));
  preview=item('Model','OrbitalShiftVR',data.parts.map(p=>{
    const keys=['X','Y','Z','R00','R01','R02','R10','R11','R12','R20','R21','R22'];
    const cf=`<CoordinateFrame name="CFrame">${keys.map((k,i)=>`<${k}>${p.cf[i]}</${k}>`).join('')}</CoordinateFrame>`;
    const size=`<Vector3 name="size"><X>${p.size[0]}</X><Y>${p.size[1]}</Y><Z>${p.size[2]}</Z></Vector3>`;
    const labels=p.labels.map(l=>item('SurfaceGui','SurfaceGui',item('TextLabel','Text','',`<string name="Text">${escape(l.text)}</string>${color('TextColor3',l.color)}<bool name="TextScaled">true</bool><float name="BackgroundTransparency">1</float><UDim2 name="Size"><XS>1</XS><XO>0</XO><YS>1</YS><YO>0</YO></UDim2>`),`<token name="Face">${l.face}</token><token name="SizingMode">1</token><float name="PixelsPerStud">65</float><float name="LightInfluence">0</float>`)).join('');
    return item('Part',p.name,labels,`${cf}${size}${color('Color',p.color)}<token name="Material">${p.material}</token><token name="shape">${p.shape}</token><bool name="Anchored">true</bool><bool name="CanCollide">${p.collide}</bool><float name="Transparency">${p.transparency}</float>`);
  }).join(''));
}
const xml=`<roblox version="4"><External>null</External><External>nil</External>${item('Workspace','Workspace',preview, '<float name="Gravity">0</float><bool name="StreamingEnabled">false</bool>')}${item('ReplicatedStorage','ReplicatedStorage',item('Folder','OrbitalShiftVR',item('Folder','Shared',scripts('shared'))))}${item('ServerScriptService','ServerScriptService',item('Folder','OrbitalShiftVR',scripts('server')))}${item('StarterPlayer','StarterPlayer',item('StarterPlayerScripts','StarterPlayerScripts',item('Folder','OrbitalShiftVR',scripts('client'))))}${item('ServerStorage','ServerStorage')}${item('Lighting','Lighting','', '<float name="Brightness">2</float><bool name="GlobalShadows">false</bool>'+color('Ambient',[.59,.62,.66]))}</roblox>`;
fs.writeFileSync(path.join(out,'Orbital Shift VR.rbxlx'),xml);
const manifest={version:'0.1.0',built:new Date().toISOString(),files:modules.map(m=>({file:m.file,lines:m.source.split('\n').length,sha256:crypto.createHash('sha256').update(m.source).digest('hex')}))};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
console.log(JSON.stringify({modules:modules.length,lines:manifest.files.reduce((n,m)=>n+m.lines,0),chunks:chunks.length+1,place:path.join(out,'Orbital Shift VR.rbxlx')}));
