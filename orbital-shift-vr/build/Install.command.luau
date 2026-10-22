-- ORBITAL SHIFT VR: namespace-only, repeatable source installer. Run in EDIT mode of an EMPTY place.
assert(not game:GetService('RunService'):IsRunning(),'Stop Play before installing')
assert(game.PlaceId==0 or game:GetAttribute('OrbitalShiftProject'),'Use an unsaved empty place or the explicitly approved Orbital Shift place')
local function folder(parent,name) local f=parent:FindFirstChild(name); if not f then f=Instance.new('Folder'); f.Name=name; f.Parent=parent end; return f end
local function put(service,names,name,class,source) local f=game:GetService(service); for _,n in names do f=folder(f,n) end; local s=f:FindFirstChild(name); if s and s.ClassName~=class then error('Conflicting class: '..name) end; if not s then s=Instance.new(class); s.Name=name end; s.Source=source; s.Parent=f end
put([==[ReplicatedStorage]==],{[==[OrbitalShiftVR]==],[==[Shared]==]},[==[Config]==],[==[ModuleScript]==],[==[--!strict
return {
	Version = "0.1.0", Namespace = "OrbitalShiftVR", MaxPlayers = 2,
	Physics = {BodyRadius=1.05, HandRadius=0.24, Reach=5.5, GrabRadius=0.85,
		MaxSpeed=7, MaxThrow=12, MaxSpin=10, BodyForce=850, HandForce=220,
		HandSpeed=18, GripForce=700, GripResponse=24, PullGain=7, PullDamping=2.5,
		SnapDegrees=30, PoseHz=25, PoseTimeout=0.65, TetherLength=29},
	Modes = {Assisted={Damping=0.28, Speed=5, Tolerance=0.9}, Inertial={Damping=0.035, Speed=7, Tolerance=0.65}},
	Socket = {Distance=1.35, Alignment=0.7, SettleSpeed=4},
	Signal = {Yaw=35, Pitch=-20, Tolerance=7, HoldSeconds=3},
	Checkpoints = {CFrame.new(0,5,7),CFrame.new(0,5,-24),CFrame.new(0,5,-51),CFrame.new(0,5,-77)},
	Bounds = {Min=Vector3.new(-34,-12,-135), Max=Vector3.new(34,26,25)},
	Profiles = {
		Quest={GrabLeft="ButtonL1",GrabRight="ButtonR1",UseLeft="ButtonL2",UseRight="ButtonR2",Menu="ButtonY",Recover="ButtonB"},
		["Pico / SteamVR"]={GrabLeft="ButtonL1",GrabRight="ButtonR1",UseLeft="ButtonL2",UseRight="ButtonR2",Menu="ButtonY",Recover="ButtonB"},
		["Swapped grips/triggers"]={GrabLeft="ButtonL2",GrabRight="ButtonR2",UseLeft="ButtonL1",UseRight="ButtonR1",Menu="ButtonY",Recover="ButtonB"},
	},
}
]==])
put([==[ReplicatedStorage]==],{[==[OrbitalShiftVR]==],[==[Shared]==]},[==[Missions]==],[==[ModuleScript]==],[==[--!strict
return {
	[0]={Title="00 / FIRST CONTACT",Zone="TRAINING",Hint="Grab an orange rail. Pull your hands toward you to move your body.",Checkpoint=1},
	[1]={Title="01 / RESTORE POWER",Zone="MAINTENANCE",Hint="Find both orange energy cells. Guide them into A and B, release, then pull the main lever.",Checkpoint=2},
	[2]={Title="02 / FIND THE SIGNAL",Zone="OBSERVATORY",Hint="Connect both cable ends. Hold USE on each wheel to turn; reverse with Shift or left stick down. Match 35° / −20°.",Checkpoint=3},
	[3]={Title="03 / BRING IT HOME",Zone="AIRLOCK / EVA",Hint="Close inner hatch → equalize → clip tether → turn outer wheel. Retrieve the research case, dock it, close outer hatch, repressurize.",Checkpoint=4},
	[4]={Title="SHIFT COMPLETE",Zone="ALL SYSTEMS NOMINAL",Hint="The station is back online. Open the menu to replay or keep practicing.",Checkpoint=4},
	Tutorial={
		"GRAB / Hold Q or E near an orange rail. In VR squeeze a grip.",
		"PULL / While holding, W pulls hands toward you. A/D sideways, R/F up/down. VR: move your real hand.",
		"COAST / Release your grip while moving. Momentum carries you.",
		"BRAKE / Grab another rail and hold still until your speed drops.",
		"CARRY / Grab the small cyan practice cell on the training rack.",
		"DOCK / Move the practice cell into the cyan holder and release. H recovers to safety.",
	},
}
]==])
put([==[ReplicatedStorage]==],{[==[OrbitalShiftVR]==],[==[Shared]==]},[==[Types]==],[==[ModuleScript]==],[==[--!strict
export type Hand = "Left" | "Right"
export type Grip = {part: BasePart, localAnchor: Vector3, kind: string, offset: CFrame?}
export type Snapshot = {stage: number, tutorial: number, signal: number, elapsed: number, revision: number}
export type Pose = {seq: number, head: CFrame, left: CFrame, right: CFrame, tracked: boolean}
return {}
]==])
put([==[ReplicatedStorage]==],{[==[OrbitalShiftVR]==],[==[Shared]==]},[==[Util]==],[==[ModuleScript]==],[==[--!strict
local U = {}
function U.finite(n: any): boolean return type(n)=="number" and n==n and math.abs(n)<1e8 end
function U.vector(v: any): boolean return typeof(v)=="Vector3" and U.finite(v.X) and U.finite(v.Y) and U.finite(v.Z) end
function U.frame(v: any): boolean
	if typeof(v)~="CFrame" then return false end
	for _,n in {v:GetComponents()} do if not U.finite(n) then return false end end
	return true
end
function U.clamp(v: Vector3, n: number): Vector3 return if v.Magnitude>n then v.Unit*n else v end
function U.surface(part: BasePart, point: Vector3): Vector3
	local p=part.CFrame:PointToObjectSpace(point); local h=part.Size/2
	return part.CFrame:PointToWorldSpace(Vector3.new(math.clamp(p.X,-h.X,h.X),math.clamp(p.Y,-h.Y,h.Y),math.clamp(p.Z,-h.Z,h.Z)))
end
function U.inside(v: Vector3, lo: Vector3, hi: Vector3): boolean
	return v.X>=lo.X and v.X<=hi.X and v.Y>=lo.Y and v.Y<=hi.Y and v.Z>=lo.Z and v.Z<=hi.Z
end
function U.scaled(cf: CFrame, scale: number): CFrame return cf.Rotation+cf.Position*scale end
function U.bucket(bucket, key, rate: number, capacity: number): boolean
	local now=os.clock(); local b=bucket[key]
	if not b then b={n=capacity,t=now}; bucket[key]=b end
	b.n=math.min(capacity,b.n+(now-b.t)*rate); b.t=now
	if b.n<1 then return false end; b.n-=1; return true
end
return U
]==])
put([==[ServerScriptService]==],{[==[OrbitalShiftVR]==]},[==[Bootstrap]==],[==[Script]==],[==[local Players=game:GetService("Players")
local Run=game:GetService("RunService")
local Replicated=game:GetService("ReplicatedStorage")
local namespace=Replicated:WaitForChild("OrbitalShiftVR")
local Config=require(namespace.Shared.Config)
local U=require(namespace.Shared.Util)
local World=require(script.Parent.WorldBuilder)
local world=World.build(workspace:GetAttribute("OSTrainingOnly")==true)
local remotes=namespace:FindFirstChild("Remotes") or Instance.new("Folder"); remotes.Name="Remotes"; remotes.Parent=namespace
local function remote(name,class)
	local r=remotes:FindFirstChild(name) or Instance.new(class); r.Name=name; r.Parent=remotes; return r
end
local action=remote("Action","RemoteEvent"); local pose=remote("Pose","UnreliableRemoteEvent"); local feedback=remote("Feedback","RemoteEvent")
local state=namespace:FindFirstChild("State") or Instance.new("Folder"); state.Name="State"; state.Parent=namespace
local Rigs=require(script.Parent.PlayerRigService); local Grabs=require(script.Parent.GrabService)
local Missions=require(script.Parent.MissionService); local Interactions=require(script.Parent.InteractionService); local Recovery=require(script.Parent.RecoveryService)
Rigs.init(); Missions.init(state,feedback); Missions.rigs=Rigs
Grabs.init(Rigs,feedback,Missions.event); Interactions.init(Rigs,Grabs,Missions,feedback); Recovery.init(Rigs,Grabs,Missions,Interactions,feedback)
Rigs.onRemove=Grabs.clear; Rigs.onTrackingLost=Grabs.clear
local actionBucket,poseBucket,cooldowns={},{},{}
local rejects=0
local function deny() rejects+=1; state:SetAttribute("RejectedRequests",rejects) end
local function added(player)
	if #Players:GetPlayers()>Config.MaxPlayers then player:Kick("Orbital Shift VR has room for two crew members."); return end
	local cf=Config.Checkpoints[state:GetAttribute("Checkpoint") or 1]*CFrame.new(if #Players:GetPlayers()==2 then 1 else 0,0,0)
	Rigs.spawn(player,cf)
	player.CharacterRemoving:Connect(function() task.defer(function() if player.Parent and not Rigs.players[player] then Rigs.spawn(player,cf) end end) end)
end
Players.PlayerAdded:Connect(added); Players.PlayerRemoving:Connect(function(player)
	Rigs.remove(player); actionBucket[player]=nil; poseBucket[player]=nil; cooldowns[player]=nil
end)
for _,player in Players:GetPlayers() do task.defer(added,player) end
pose.OnServerEvent:Connect(function(player,data)
	if not U.bucket(poseBucket,player,32,40) or not Rigs.pose(player,data) then deny(); return end
	local s=Rigs.players[player]
	-- Relayed samples carry a server-validated player identity and monotonically increasing sequence.
	pose:FireAllClients(player.UserId,{seq=s.seq,head=s.head,left=s.hands.Left.pose,right=s.hands.Right.pose,tracked=s.tracked})
end)
action.OnServerEvent:Connect(function(player,data)
	if not U.bucket(actionBucket,player,18,26) or type(data)~="table" or type(data.action)~="string" or #data.action>32 then deny(); return end
	local s=Rigs.players[player]; if not s then return end
	local name=data.action
	if name=="Snapshot" then feedback:FireClient(player,Missions.snapshot())
	elseif name=="Grab" then if not Grabs.begin(player,data.side,data.part) then deny() end
	elseif name=="Release" then if data.side=="Left" or data.side=="Right" then Grabs.release(player,data.side) else deny() end
	elseif name=="Use" then
		if type(data.down)~="boolean" or not Interactions.use(player,data.side,data.part,data.down,data.reverse) then deny() end
	elseif name=="Pause" then
		if type(data.value)~="boolean" then deny(); return end
		s.paused=data.value; Grabs.clear(player)
	elseif name=="Recenter" then Grabs.clear(player)
	elseif name=="Mode" then if Config.Modes[data.value] then s.mode=data.value else deny() end
	elseif name=="Recover" or name=="ResetCheckpoint" or name=="Restart" or name=="RestoreObjects" or name=="RepeatTutorial" then
		local last=cooldowns[player] or -10; if os.clock()-last<2 then deny(); return end; cooldowns[player]=os.clock()
		if name=="Recover" then Recovery.recover(player)
		elseif name=="RepeatTutorial" then Recovery.reset(true)
		elseif name=="RestoreObjects" then for _,p in Interactions.items:GetChildren() do if p:GetAttribute("Kind")=="Loose" and not p:GetAttribute("Docked") and not Grabs.claims[p] then Recovery.object(p) end end
		else Recovery.reset(name=="Restart") end
	elseif name=="SkipTutorial" then Missions.transition(0,1)
	elseif name=="Push" then
		if not Interactions.push(player,data.side,data.part) then deny() end
	else deny() end
end)
local accumulator=0
Run.Heartbeat:Connect(function(dt)
	Grabs.step(); Interactions.step(math.min(dt,0.1))
	accumulator+=dt; if accumulator>=0.1 then Missions.step(accumulator); accumulator=0 end
end)
local recoveryTime=0
Run.Heartbeat:Connect(function(dt) recoveryTime+=dt; if recoveryTime>0.5 then Recovery.step(recoveryTime); recoveryTime=0 end end)
game:BindToClose(function() for player in Rigs.players do Grabs.clear(player) end end)
print("[OrbitalShiftVR] Server ready / "..Config.Version.." / "..world:GetAttribute("BuiltPhase"))
]==])
put([==[ServerScriptService]==],{[==[OrbitalShiftVR]==]},[==[GrabService]==],[==[ModuleScript]==],[==[local Collection=game:GetService("CollectionService")
local Config=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Config)
local U=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Util)
local G={claims={}}
function G.init(rigs,feedback,event)
	G.rigs=rigs; G.feedback=feedback; G.event=event
end
function G.valid(s,side,part,radius)
	if side~="Left" and side~="Right" then return false end
	if not s or s.paused or not s.tracked or os.clock()-s.lastPose>Config.Physics.PoseTimeout then return false end
	if typeof(part)~="Instance" or not part:IsA("BasePart") or not part:IsDescendantOf(workspace.OrbitalShiftVR.Interactables) or not Collection:HasTag(part,"OSInteractable") then return false end
	local hand=s.hands[side]; local point=U.surface(part,hand.pose.Position)
	if (point-hand.pose.Position).Magnitude>(radius or Config.Physics.GrabRadius) or (point-s.root.Position).Magnitude>Config.Physics.Reach then return false end
	local params=RaycastParams.new(); params.FilterType=Enum.RaycastFilterType.Exclude; params.FilterDescendantsInstances={s.model}; params.RespectCanCollide=true
	local dir=point-s.root.Position; local hit=workspace:Raycast(s.root.Position,dir,params)
	return not hit or hit.Instance==part or hit.Distance>=dir.Magnitude-0.55
end
function G.begin(player,side,part)
	local s=G.rigs.players[player]
	if not G.valid(s,side,part) or s.grips[side] then return false,"Out of reach" end
	local kind=part:GetAttribute("Kind")
	if kind~="Rail" and kind~="Loose" and kind~="Wheel" and kind~="Lever" and kind~="Door" then return false,"Not a grip" end
	if part:GetAttribute("Docked") then return false,"Docked" end
	local claim=G.claims[part]
	if kind=="Loose" and claim and claim.player~=player then return false,"Other crew member is holding this" end
	local point=U.surface(part,s.hands[side].pose.Position)
	local grip={part=part,kind=kind,localAnchor=part.CFrame:PointToObjectSpace(point),offset=s.hands[side].pose:ToObjectSpace(part.CFrame)}
	s.grips[side]=grip
	if kind=="Loose" then
		if not claim then
			local folder=Instance.new("Folder"); folder.Name="ActiveGrip"; folder.Parent=part
			local target=Instance.new("Part"); target.Name="GripTarget"; target.Size=Vector3.one*0.1; target.Transparency=1; target.CanCollide=false; target.CanQuery=false; target.Anchored=true; target.CFrame=part.CFrame; target.Parent=folder
			local a=Instance.new("Attachment"); a.Name="GripAttachment"; a.Parent=part
			local b=Instance.new("Attachment"); b.Parent=target
			local pos=Instance.new("AlignPosition"); pos.Mode=Enum.PositionAlignmentMode.TwoAttachment; pos.Attachment0=a; pos.Attachment1=b
			pos.MaxForce=Config.Physics.GripForce; pos.MaxVelocity=12; pos.Responsiveness=Config.Physics.GripResponse; pos.RigidityEnabled=false
			pos.ReactionForceEnabled=false; pos.ApplyAtCenterOfMass=true; pos.Parent=folder
			local rot=Instance.new("AlignOrientation"); rot.Mode=Enum.OrientationAlignmentMode.TwoAttachment; rot.Attachment0=a; rot.Attachment1=b
			rot.MaxTorque=400; rot.MaxAngularVelocity=10; rot.Responsiveness=20; rot.RigidityEnabled=false; rot.ReactionTorqueEnabled=false; rot.Parent=folder
			claim={player=player,folder=folder,target=target,attachment=a}; G.claims[part]=claim; part:SetAttribute("HeldBy",player.UserId)
			part:SetNetworkOwner(player)
		end
		local n=Instance.new("NoCollisionConstraint"); n.Part0=part; n.Part1=s.hands[side].part; n.Parent=claim.folder
		local n2=Instance.new("NoCollisionConstraint"); n2.Part0=part; n2.Part1=s.root; n2.Parent=claim.folder
	end
	G.feedback:FireClient(player,{type="Grip",side=side,part=part,kind=kind,anchor=grip.localAnchor,offset=grip.offset})
	G.event(player,"Grab",part)
	return true
end
function G.release(player,side,noThrow)
	local s=G.rigs.players[player]; if not s then return end
	local grip=s.grips[side]; if not grip then return end
	s.grips[side]=nil
	local part=grip.part
	local other=s.grips[if side=="Left" then "Right" else "Left"]
	if grip.kind=="Loose" and (not other or other.part~=part) then
		local claim=G.claims[part]
		if claim then claim.folder:Destroy(); claim.attachment:Destroy(); G.claims[part]=nil end
		part:SetAttribute("HeldBy",nil)
		-- History is already in world space, including body motion. Never add root velocity again.
		local samples=s.samples[side]
		if not noThrow and #samples>=2 then
			local a,b=samples[1],samples[#samples]; local dt=b.t-a.t
			if dt>0.02 then
				part.AssemblyLinearVelocity=U.clamp((b.cf.Position-a.cf.Position)/dt,Config.Physics.MaxThrow)
				local axis,angle=(a.cf.Rotation:Inverse()*b.cf.Rotation):ToAxisAngle()
				part.AssemblyAngularVelocity=U.clamp(a.cf:VectorToWorldSpace(axis)*angle/dt,Config.Physics.MaxSpin)
			end
		end
		part:SetNetworkOwner(nil)
		if G.tryDock then G.tryDock(player,part) end
	end
	G.feedback:FireClient(player,{type="Release",side=side})
	G.event(player,"Release",part)
end
function G.clear(player)
	G.release(player,"Left",true); G.release(player,"Right",true)
	local s=G.rigs.players[player]; if s then s.uses={}; s.samples={Left={},Right={}} end
end
function G.step()
	for part,claim in G.claims do
		local s=G.rigs.players[claim.player]
		if not s or not part.Parent then continue end
		local sum=Vector3.zero; local count=0; local rotation=nil
		for side,grip in s.grips do if grip.part==part then
			local desired=s.hands[side].pose*grip.offset; sum+=desired.Position; count+=1; rotation=rotation or desired.Rotation
		end end
		if count>0 then claim.target.CFrame=rotation+sum/count end
	end
end
return G
]==])

-- ORBITAL SHIFT VR: namespace-only, repeatable source installer. Run in EDIT mode of an EMPTY place.
assert(not game:GetService('RunService'):IsRunning(),'Stop Play before installing')
assert(game.PlaceId==0 or game:GetAttribute('OrbitalShiftProject'),'Use an unsaved empty place or the explicitly approved Orbital Shift place')
local function folder(parent,name) local f=parent:FindFirstChild(name); if not f then f=Instance.new('Folder'); f.Name=name; f.Parent=parent end; return f end
local function put(service,names,name,class,source) local f=game:GetService(service); for _,n in names do f=folder(f,n) end; local s=f:FindFirstChild(name); if s and s.ClassName~=class then error('Conflicting class: '..name) end; if not s then s=Instance.new(class); s.Name=name end; s.Source=source; s.Parent=f end
put([==[ServerScriptService]==],{[==[OrbitalShiftVR]==]},[==[InteractionService]==],[==[ModuleScript]==],[==[local Tween=game:GetService("TweenService")
local Config=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Config)
local U=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Util)
local I={}
function I.init(rigs,grabs,missions,feedback)
	I.rigs=rigs; I.grabs=grabs; I.missions=missions; I.feedback=feedback; I.items=workspace.OrbitalShiftVR.Interactables
	I.sockets={}; for _,p in I.items:GetChildren() do if p:GetAttribute("Kind")=="Socket" then table.insert(I.sockets,p) end end
	missions.state:SetAttribute("Pressure","Cabin"); missions.state:SetAttribute("EVAOpened",false)
	grabs.tryDock=I.dock
end
function I.notice(player,text) I.feedback:FireClient(player,{type="Notice",text=text}) end
function I.sealed(id)
	local door=I.items:FindFirstChild(id)
	return door and not door:GetAttribute("Open") and math.abs(door.Mechanism.CurrentPosition)<0.35
end
function I.door(id,open)
	local door=I.items:FindFirstChild(id); if not door then return end
	door:SetAttribute("Open",open); door.Mechanism.TargetPosition=if open then 10.5 else 0
end
function I.push(player,side,part)
	local s=I.rigs.players[player]
	if not I.grabs.valid(s,side,part,0.95) or (part:GetAttribute("Kind")~="Rail" and part:GetAttribute("Kind")~="Door") then return false end
	if os.clock()-(s.lastPush or -10)<0.6 then return false end
	if s.grips[side] then I.grabs.release(player,side,true) end
	if next(s.grips) then return false end
	local delta=s.root.Position-U.surface(part,s.root.Position); if delta.Magnitude<0.1 then return false end
	s.lastPush=os.clock()
	-- Set a bounded departure speed; do not add a second full impulse to existing contact velocity.
	local extra=math.clamp(1.8-s.root.AssemblyLinearVelocity:Dot(delta.Unit),0,1.8)
	s.root:ApplyImpulse(delta.Unit*s.root.AssemblyMass*extra); return true
end
function I.dock(player,object)
	if object:GetAttribute("Docked") or I.grabs.claims[object] or object:GetAttribute("Kind")~="Loose" then return false end
	local s=I.rigs.players[player]; if not s or (object.Position-s.root.Position).Magnitude>Config.Physics.Reach+1 then return false end
	for _,socket in I.sockets do
		if socket:GetAttribute("Occupied") or I.missions.stage<(socket:GetAttribute("MinStage") or 0) or socket:GetAttribute("Accepts")~=object:GetAttribute("ItemType") then continue end
		local cf=socket.Dock.WorldCFrame
		if (object.Position-cf.Position).Magnitude>Config.Socket.Distance or object.CFrame.UpVector:Dot(cf.UpVector)<Config.Socket.Alignment
			or object.CFrame.LookVector:Dot(cf.LookVector)<Config.Socket.Alignment or object.AssemblyLinearVelocity.Magnitude>Config.Socket.SettleSpeed then continue end
		local params=RaycastParams.new(); params.FilterType=Enum.RaycastFilterType.Exclude; params.FilterDescendantsInstances={s.model,object,socket}; params.RespectCanCollide=true
		if workspace:Raycast(object.Position,cf.Position-object.Position,params) then continue end
		object.AssemblyLinearVelocity=Vector3.zero; object.AssemblyAngularVelocity=Vector3.zero; object.CFrame=cf
		local w=Instance.new("WeldConstraint"); w.Name="DockWeld"; w.Part0=socket; w.Part1=object; w.Parent=object
		object:SetAttribute("Docked",true); socket:SetAttribute("Occupied",true); socket:SetAttribute("ItemId",object.Name)
		socket.Color=Color3.fromRGB(112,228,158); I.notice(player,"LOCKED / "..socket.Name); I.missions.event(player,"Dock",object)
		return true
	end
	return false
end
function I.use(player,side,part,down,reverse)
	local s=I.rigs.players[player]
	if not s or (side~="Left" and side~="Right") then return false end
	if not down then s.uses[side]=nil; return true end
	if not I.grabs.valid(s,side,part,1.1) or type(reverse)~="boolean" then return false end
	if I.missions.stage<(part:GetAttribute("MinStage") or 0) then I.notice(player,"Restore the previous system first"); return false end
	local kind=part:GetAttribute("Kind"); local id=part.Name; local state=I.missions.state
	if kind=="Rail" or kind=="Door" then return I.push(player,side,part)
	elseif kind=="Wheel" then
		local grip=s.grips[side]
		if not grip or grip.part~=part then I.notice(player,"Hold the wheel with GRAB, then hold USE"); return false end
		if id=="OuterWheel" and (not I.sealed("InnerHatch") or state:GetAttribute("Pressure")~="Vacuum" or not s.tether) then
			I.notice(player,"Seal inner hatch, equalize, and clip tether first"); return false
		end
		s.uses[side]={part=part,direction=if reverse then -1 else 1}; return true
	elseif kind=="Lever" then
		local grip=s.grips[side]; if not grip or grip.part~=part then I.notice(player,"Grab the lever before using it"); return false end
		local h=part.Mechanism; h.TargetAngle=if h.TargetAngle>0 then -35 else 35; part:SetAttribute("Setpoint",h.TargetAngle); return true
	elseif kind=="Loose" then
		I.grabs.release(player,side,true); return I.dock(player,part)
	elseif kind~="Button" then return false end
	local last=part:GetAttribute("PressedAt") or -10; if os.clock()-last<0.6 then return false end
	part:SetAttribute("PressedAt",os.clock())
	local rest=part:GetAttribute("Rest"); if rest then
		part.CFrame=rest*CFrame.new(0,0,-0.09); Tween:Create(part,TweenInfo.new(0.18),{CFrame=rest}):Play()
	end
	if id=="SkipTutorial" then if I.missions.stage==0 then I.missions.transition(0,1) end
	elseif id=="InnerControl" or id=="InnerControlInside" then
		if not I.sealed("OuterHatch") or state:GetAttribute("Pressure")~="Cabin" then I.notice(player,"Close outer hatch and repressurize first"); return false end
		I.door("InnerHatch",not I.items.InnerHatch:GetAttribute("Open"))
	elseif id=="Equalize" then
		if not I.sealed("InnerHatch") or not I.sealed("OuterHatch") then I.notice(player,"Both hatches must be sealed"); return false end
		if state:GetAttribute("Pressure")=="Cycling" then return false end
		local nextPressure=if state:GetAttribute("Pressure")=="Cabin" then "Vacuum" else "Cabin"
		state:SetAttribute("Pressure","Cycling"); local revision=I.missions.revision
			task.delay(2,function() if I.missions.revision==revision and I.sealed("InnerHatch") and I.sealed("OuterHatch") then state:SetAttribute("Pressure",nextPressure) end end)
	elseif id=="TetherClip" then
		if s.tether then I.notice(player,"Tether attached"); return true end
		local a=Instance.new("Attachment"); a.Name="TetherAnchor"; a.Parent=part
		local rope=Instance.new("RopeConstraint"); rope.Name="SafetyLine"; rope.Attachment0=a; rope.Attachment1=s.root.BodyAttachment
		rope.Length=Config.Physics.TetherLength; rope.Restitution=0; rope.Thickness=0.06; rope.Visible=true; rope.Color=BrickColor.new("Bright orange"); rope.Parent=s.model
		s.tether=true; s.tetherAnchor=a; s.model:SetAttribute("Tethered",true); I.notice(player,"SAFETY LINE / ATTACHED")
	end
	return true
end
function I.step(dt)
	local used={}
	for player,s in I.rigs.players do
		for side,use in s.uses do
			if not s.grips[side] or s.grips[side].part~=use.part or not I.grabs.valid(s,side,use.part,2) then s.uses[side]=nil; continue end
			local part=use.part
			if not used[part] then
				used[part]=true; local h=part.Mechanism
				h.TargetAngle=math.clamp(h.TargetAngle+use.direction*27*dt,h.LowerAngle,h.UpperAngle); part:SetAttribute("Setpoint",h.TargetAngle)
			end
		end
		if s.tether and s.tetherAnchor and s.tetherAnchor.Parent then
			local delta=s.root.Position-s.tetherAnchor.WorldPosition
			if delta.Magnitude>Config.Physics.TetherLength-2 then
				local outward=math.max(0,s.root.AssemblyLinearVelocity:Dot(delta.Unit))
				s.root:ApplyImpulse(-delta.Unit*math.min(4,outward+(delta.Magnitude-Config.Physics.TetherLength+2)*dt*3)*s.root.AssemblyMass)
			end
		end
	end
	if I.missions.stage>=2 then I.door("PowerDoor",true) end
	if I.missions.stage==3 then
		local wheel=I.items.OuterWheel
		if wheel.Mechanism.CurrentAngle>55 and not I.items.InnerHatch:GetAttribute("Open") and I.missions.state:GetAttribute("Pressure")=="Vacuum" then
			I.door("OuterHatch",true); I.missions.state:SetAttribute("EVAOpened",true)
		elseif wheel.Mechanism.CurrentAngle<15 then I.door("OuterHatch",false) end
	end
end
return I
]==])
put([==[ServerScriptService]==],{[==[OrbitalShiftVR]==]},[==[MissionService]==],[==[ModuleScript]==],[==[local Config=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Config)
local Definitions=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Missions)
local M={stage=0,tutorial=1,signalTime=0,revision=0,started=os.clock(),events={},listeners={}}
function M.init(state,feedback)
	M.state=state; M.feedback=feedback; M.items=workspace.OrbitalShiftVR.Interactables
	M.publish()
end
function M.publish()
	M.revision+=1
	M.state:SetAttribute("Stage",M.stage); M.state:SetAttribute("Tutorial",M.tutorial); M.state:SetAttribute("Revision",M.revision)
	M.state:SetAttribute("Title",Definitions[M.stage].Title); M.state:SetAttribute("Hint",Definitions[M.stage].Hint)
	M.state:SetAttribute("Checkpoint",Definitions[M.stage].Checkpoint)
	M.state:SetAttribute("Elapsed",math.floor(os.clock()-M.started))
end
function M.transition(expected,nextStage)
	if M.stage~=expected or nextStage~=expected+1 then return false end
	M.stage=nextStage; M.signalTime=0; M.publish()
	M.feedback:FireAllClients({type="Notice",text=Definitions[nextStage].Title})
	if M.onTransition then M.onTransition(nextStage) end
	return true
end
function M.event(player,name,part)
	if M.stage~=0 then return end
	local p=M.rigs and M.rigs.players[player]; if not p then return end
	if name=="Grab" and part:GetAttribute("Kind")=="Rail" then
		if M.tutorial==1 then M.tutorial=2; M.tutorialOrigin=p.root.Position
		elseif M.tutorial==4 then M.braking=true end
	elseif name=="Release" and part:GetAttribute("Kind")=="Rail" and M.tutorial==3 and p.root.AssemblyLinearVelocity.Magnitude>0.25 then
		M.tutorial=4
	elseif name=="Grab" and part:GetAttribute("Id")=="PracticeCell" and M.tutorial==5 then M.tutorial=6
	elseif name=="Dock" and part:GetAttribute("ItemType")=="Practice" and M.tutorial==6 then M.transition(0,1) end
	M.publish()
end
function M.docked(id) local p=M.items:FindFirstChild(id); return p and p:GetAttribute("Occupied")==true end
function M.step(dt)
	if M.stage==0 then
		for _,s in M.rigs.players do
			if M.tutorial==2 and M.tutorialOrigin and (s.root.Position-M.tutorialOrigin).Magnitude>1.7 then M.tutorial=3; M.publish()
			elseif M.tutorial==4 and M.braking and next(s.grips) and s.root.AssemblyLinearVelocity.Magnitude<0.7 then M.tutorial=5; M.publish() end
		end
	elseif M.stage==1 then
		local lever=M.items:FindFirstChild("MainLever")
		if lever and M.docked("PowerA") and M.docked("PowerB") and lever.Mechanism.CurrentAngle>24 then M.transition(1,2) end
	elseif M.stage==2 then
		local yaw=M.items.YawWheel.Mechanism.CurrentAngle; local pitch=M.items.PitchWheel.Mechanism.CurrentAngle
		local error=math.max(math.abs(yaw-Config.Signal.Yaw),math.abs(pitch-Config.Signal.Pitch))
		local connected=M.docked("CableSource") and M.docked("CableReceiver")
		local signal=if connected then math.clamp(1-error/90,0,1) else 0
		M.state:SetAttribute("Signal",math.floor(signal*100)); M.state:SetAttribute("Yaw",math.floor(yaw)); M.state:SetAttribute("Pitch",math.floor(pitch))
		if connected and error<=Config.Signal.Tolerance then M.signalTime+=dt else M.signalTime=0 end
		M.state:SetAttribute("SignalHold",M.signalTime)
		local display=workspace.OrbitalShiftVR.Station:FindFirstChild("SignalReadout")
		if display then display.SurfaceGui.Text.Text=string.format("SIGNAL %02d%%  /  LOCK %.1fs\nYAW %d°  ·  PITCH %d°",signal*100,M.signalTime,yaw,pitch) end
		M.items.AntennaDish.CFrame=CFrame.new(8,15,-56)*CFrame.Angles(math.rad(pitch),math.rad(yaw),math.pi/2)
		if M.signalTime>=Config.Signal.HoldSeconds then M.transition(2,3) end
	elseif M.stage==3 then
		if M.docked("ResearchDock") and not M.items.OuterHatch:GetAttribute("Open") and not M.items.InnerHatch:GetAttribute("Open")
			and math.abs(M.items.OuterHatch.Mechanism.CurrentPosition)<0.35 and math.abs(M.items.InnerHatch.Mechanism.CurrentPosition)<0.35
			and M.state:GetAttribute("Pressure")=="Cabin" and M.state:GetAttribute("EVAOpened") then M.transition(3,4) end
	end
end
function M.snapshot()
	local sockets={}; for _,p in M.items:GetChildren() do if p:GetAttribute("Kind")=="Socket" then sockets[p.Name]=p:GetAttribute("ItemId") or "" end end
	return {type="Snapshot",stage=M.stage,tutorial=M.tutorial,revision=M.revision,sockets=sockets,elapsed=os.clock()-M.started}
end
return M
]==])
put([==[ServerScriptService]==],{[==[OrbitalShiftVR]==]},[==[PlayerRigService]==],[==[ModuleScript]==],[==[local Players=game:GetService("Players")
local Physics=game:GetService("PhysicsService")
local Config=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Config)
local U=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Util)
local R={players={}}
local function p(parent,name,size,cf,anchored)
	local v=Instance.new("Part"); v.Name=name; v.Size=size; v.CFrame=cf; v.Anchored=anchored or false
	v.CanCollide=false; v.CanTouch=false; v.Transparency=1; v.Parent=parent; return v
end
function R.init()
	Players.CharacterAutoLoads=false
	for _,name in {"OSBody","OSHand","OSObject","OSMechanism"} do pcall(function() Physics:RegisterCollisionGroup(name) end) end
	Physics:CollisionGroupSetCollidable("OSMechanism","Default",false)
	Physics:CollisionGroupSetCollidable("OSBody","OSHand",false)
	Physics:CollisionGroupSetCollidable("OSHand","OSHand",false)
	Physics:CollisionGroupSetCollidable("OSBody","OSBody",false)
	for _,v in workspace.OrbitalShiftVR.Interactables:GetChildren() do
		if v:IsA("BasePart") and v:GetAttribute("Kind")=="Loose" then v.CollisionGroup="OSObject"; v:SetNetworkOwner(nil) end
		if v:IsA("BasePart") and (v:GetAttribute("Kind")=="Door" or v:GetAttribute("Kind")=="Lever" or v:GetAttribute("Kind")=="Wheel") then v.CollisionGroup="OSMechanism"; v:SetNetworkOwner(nil) end
	end
end
function R.spawn(player,cf)
	if R.players[player] then R.remove(player) end
	local model=Instance.new("Model"); model.Name="Crew_"..player.UserId; model:SetAttribute("Owner",player.UserId); model.Parent=workspace.OrbitalShiftVR.Rigs
	local root=p(model,"HumanoidRootPart",Vector3.one*(Config.Physics.BodyRadius*2),cf)
	root.Shape=Enum.PartType.Ball; root.CanCollide=true; root.CollisionGroup="OSBody"
	root.CustomPhysicalProperties=PhysicalProperties.new(3,0.25,0,1,1); model.PrimaryPart=root
	local head=p(model,"Head",Vector3.one*0.5,cf*CFrame.new(0,1.3,0)); head.Massless=true
	local weld=Instance.new("WeldConstraint"); weld.Part0=root; weld.Part1=head; weld.Parent=head
	local humanoid=Instance.new("Humanoid"); humanoid.RequiresNeck=false; humanoid.BreakJointsOnDeath=false
	humanoid.AutoRotate=false; humanoid.WalkSpeed=0; humanoid.JumpPower=0; humanoid.PlatformStand=true; humanoid.DisplayDistanceType=Enum.HumanoidDisplayDistanceType.None
	humanoid.Parent=model; humanoid:ChangeState(Enum.HumanoidStateType.Physics)
	local a=Instance.new("Attachment"); a.Name="BodyAttachment"; a.Parent=root
	local upright=Instance.new("AlignOrientation"); upright.Name="StableHorizon"; upright.Mode=Enum.OrientationAlignmentMode.OneAttachment
	upright.Attachment0=a; upright.CFrame=CFrame.identity; upright.MaxTorque=8000; upright.MaxAngularVelocity=8; upright.Responsiveness=50; upright.RigidityEnabled=false; upright.Parent=root
	local force=Instance.new("VectorForce"); force.Name="HandLocomotion"; force.Attachment0=a; force.RelativeTo=Enum.ActuatorRelativeTo.World; force.ApplyAtCenterOfMass=true; force.Parent=root
	local hands={}
	for _,side in {"Left","Right"} do
		local hand=p(model,side.."Hand",Vector3.one*0.48,cf*CFrame.new(if side=="Left" then -0.6 else 0.6,0.7,-1.5))
		hand.Shape=Enum.PartType.Ball; hand.CanCollide=true; hand.Transparency=0; hand.Color=if side=="Left" then Color3.fromRGB(88,221,223) else Color3.fromRGB(246,126,49)
		hand.CollisionGroup="OSHand"; hand.CustomPhysicalProperties=PhysicalProperties.new(0.5,0.6,0,1,1)
		local target=p(model,side.."Target",Vector3.one*0.1,hand.CFrame,true)
		local h=Instance.new("Attachment"); h.Name="HandAttachment"; h.Parent=hand
		local t=Instance.new("Attachment"); t.Parent=target
		local pos=Instance.new("AlignPosition"); pos.Mode=Enum.PositionAlignmentMode.TwoAttachment; pos.Attachment0=h; pos.Attachment1=t
		pos.MaxForce=Config.Physics.HandForce; pos.MaxVelocity=Config.Physics.HandSpeed; pos.Responsiveness=40
		pos.ReactionForceEnabled=false; pos.RigidityEnabled=false; pos.ApplyAtCenterOfMass=true; pos.Parent=hand
		local rot=Instance.new("AlignOrientation"); rot.Mode=Enum.OrientationAlignmentMode.TwoAttachment; rot.Attachment0=h; rot.Attachment1=t
		rot.MaxTorque=200; rot.MaxAngularVelocity=12; rot.Responsiveness=35; rot.ReactionTorqueEnabled=false; rot.RigidityEnabled=false; rot.Parent=hand
		hands[side]={part=hand,target=target,attachment=h,pose=hand.CFrame}
	end
	player.Character=model; root:SetNetworkOwner(player)
	for _,hand in hands do hand.part:SetNetworkOwner(player) end
	local state={player=player,model=model,root=root,hands=hands,grips={},seq=-1,lastPose=0,lastPosition=cf.Position,
		mode="Assisted",paused=false,tether=false,uses={},samples={Left={},Right={}},lastValid=cf,spawned=os.clock()}
	R.players[player]=state; player:SetAttribute("OSReady",true)
	return state
end
function R.remove(player)
	local s=R.players[player]; if not s then return end
	if R.onRemove then R.onRemove(player) end
	if s.tetherAnchor then s.tetherAnchor:Destroy() end
	s.model:Destroy(); R.players[player]=nil
end
function R.pose(player,data)
	local s=R.players[player]
	if not s or type(data)~="table" or not U.finite(data.seq) or data.seq%1~=0 or data.seq<=s.seq or data.seq>2^31 then return false end
	if type(data.tracked)~="boolean" or not U.frame(data.left) or not U.frame(data.right) or not U.frame(data.head) then return false end
	for _,cf in {data.left,data.right,data.head} do if (cf.Position-s.root.Position).Magnitude>Config.Physics.Reach+1.5 then return false end end
	s.seq=data.seq; s.lastPose=os.clock(); s.tracked=data.tracked
	if not data.tracked then if R.onTrackingLost then R.onTrackingLost(player) end; return true end
	for side,key in {Left="left",Right="right"} do
		local hand=s.hands[side]; local cf=data[key]
		local ray=RaycastParams.new(); ray.FilterType=Enum.RaycastFilterType.Exclude; ray.FilterDescendantsInstances={s.model}; ray.RespectCanCollide=true
		local dir=cf.Position-s.root.Position
		local hit=workspace:Raycast(s.root.Position,dir,ray)
		if hit and hit.Distance<dir.Magnitude-0.5 and hit.Instance:GetAttribute("Kind")~="Loose" then
			cf=cf.Rotation+hit.Position+hit.Normal*0.3
		end
		hand.pose=cf; hand.target.CFrame=cf
		local history=s.samples[side]; table.insert(history,{t=os.clock(),cf=cf})
		while #history>2 and history[1].t<os.clock()-0.13 do table.remove(history,1) end
	end
	s.head=data.head; return true
end
return R
]==])

-- ORBITAL SHIFT VR: namespace-only, repeatable source installer. Run in EDIT mode of an EMPTY place.
assert(not game:GetService('RunService'):IsRunning(),'Stop Play before installing')
assert(game.PlaceId==0 or game:GetAttribute('OrbitalShiftProject'),'Use an unsaved empty place or the explicitly approved Orbital Shift place')
local function folder(parent,name) local f=parent:FindFirstChild(name); if not f then f=Instance.new('Folder'); f.Name=name; f.Parent=parent end; return f end
local function put(service,names,name,class,source) local f=game:GetService(service); for _,n in names do f=folder(f,n) end; local s=f:FindFirstChild(name); if s and s.ClassName~=class then error('Conflicting class: '..name) end; if not s then s=Instance.new(class); s.Name=name end; s.Source=source; s.Parent=f end
put([==[ServerScriptService]==],{[==[OrbitalShiftVR]==]},[==[RecoveryService]==],[==[ModuleScript]==],[==[local Config=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Config)
local U=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Util)
local R={templates={}}
function R.init(rigs,grabs,missions,interactions,feedback)
	R.rigs=rigs; R.grabs=grabs; R.missions=missions; R.interactions=interactions; R.feedback=feedback
	local storage=game.ServerStorage:FindFirstChild("OrbitalShiftVR") or Instance.new("Folder"); storage.Name="OrbitalShiftVR"; storage.Parent=game.ServerStorage
	for _,p in workspace.OrbitalShiftVR.Interactables:GetChildren() do if p:GetAttribute("Kind")=="Loose" then R.templates[p.Name]=p:GetAttribute("Home"); p:Clone().Parent=storage end end
end
function R.recover(player,checkpoint)
	local s=R.rigs.players[player]; if not s then return end
	R.grabs.clear(player)
	if s.tetherAnchor then s.tetherAnchor:Destroy(); s.tetherAnchor=nil end
	local rope=s.model:FindFirstChild("SafetyLine"); if rope then rope:Destroy() end
	s.tether=false; s.model:SetAttribute("Tethered",false)
	local index=checkpoint or (R.missions.state:GetAttribute("Checkpoint") or 1)
	local cf=Config.Checkpoints[index]*CFrame.new(if player.UserId%2==0 then -0.8 else 0.8,0,0)
	s.root.AssemblyLinearVelocity=Vector3.zero; s.root.AssemblyAngularVelocity=Vector3.zero; s.root.CFrame=cf
	s.lastPosition=cf.Position; s.lastValid=cf; s.lastPose=0; s.tracked=false
	for side,hand in s.hands do
		hand.part.AssemblyLinearVelocity=Vector3.zero; hand.part.CFrame=cf*CFrame.new(if side=="Left" then -0.6 else 0.6,0.7,-1.5)
		hand.target.CFrame=hand.part.CFrame; hand.pose=hand.part.CFrame
	end
	R.feedback:FireClient(player,{type="Recover",cf=cf})
end
function R.object(p)
	local owner=R.grabs.claims[p]; if owner then R.grabs.clear(owner.player) end
	local weld=p:FindFirstChild("DockWeld"); if weld then weld:Destroy() end
	for _,socket in R.interactions.sockets do if socket:GetAttribute("ItemId")==p.Name then socket:SetAttribute("Occupied",false); socket:SetAttribute("ItemId",nil); socket.Color=Color3.fromRGB(20,36,53) end end
	p:SetAttribute("Docked",false); p:SetAttribute("HeldBy",nil); p.Anchored=false
	p.AssemblyLinearVelocity=Vector3.zero; p.AssemblyAngularVelocity=Vector3.zero; p.CFrame=R.templates[p.Name] or p:GetAttribute("Home"); p:SetNetworkOwner(nil)
end
function R.reset(restart)
	for player in R.rigs.players do R.grabs.clear(player) end
	local stage=if restart then 0 else R.missions.stage
	for _,p in workspace.OrbitalShiftVR.Interactables:GetChildren() do
		if p:GetAttribute("Kind")=="Loose" then
			local kind=p:GetAttribute("ItemType")
			if restart or (stage==0 and kind=="Practice") or (stage==1 and kind=="Energy") or (stage==2 and (kind=="CableA" or kind=="CableB")) or (stage>=3 and kind=="Research") then R.object(p) end
		end
	end
	if restart then R.missions.stage=0; R.missions.tutorial=1; R.missions.started=os.clock(); R.missions.braking=false; R.missions.tutorialOrigin=nil end
	R.missions.signalTime=0; R.missions.publish()
	for _,id in {"MainLever","YawWheel","PitchWheel","OuterWheel"} do
		local p=R.interactions.items:FindFirstChild(id)
		if p and (restart or (stage==1 and id=="MainLever") or (stage==2 and (id=="YawWheel" or id=="PitchWheel")) or (stage>=3 and id=="OuterWheel")) then
			p.Mechanism.TargetAngle=if id=="MainLever" then -35 else 0; p:SetAttribute("Setpoint",p.Mechanism.TargetAngle)
		end
	end
	R.interactions.door("PowerDoor",stage>=2 and not restart); R.interactions.door("OuterHatch",false); R.interactions.door("InnerHatch",false)
	R.missions.state:SetAttribute("Pressure","Cabin"); R.missions.state:SetAttribute("EVAOpened",false)
	for player in R.rigs.players do R.recover(player) end
end
function R.step(dt)
	for player,s in R.rigs.players do
		if not U.vector(s.root.Position) or not U.inside(s.root.Position,Config.Bounds.Min,Config.Bounds.Max) or s.root.AssemblyLinearVelocity.Magnitude>35 then R.recover(player); continue end
		if s.lastPose>0 and os.clock()-s.lastPose>Config.Physics.PoseTimeout then
			if next(s.grips) then R.grabs.clear(player) end; s.tracked=false
		end
		if (s.root.Position-s.lastPosition).Magnitude>math.max(15,dt*25) and os.clock()-s.spawned>2 then R.recover(player); continue end
		s.lastPosition=s.root.Position
	end
	for _,p in workspace.OrbitalShiftVR.Interactables:GetChildren() do
		if p:GetAttribute("Kind")=="Loose" and not p:GetAttribute("Docked") then
			if not U.inside(p.Position,Config.Bounds.Min,Config.Bounds.Max) then R.object(p)
			elseif not R.grabs.claims[p] then p.AssemblyLinearVelocity=U.clamp(p.AssemblyLinearVelocity,Config.Physics.MaxThrow); p.AssemblyAngularVelocity=U.clamp(p.AssemblyAngularVelocity,Config.Physics.MaxSpin) end
		end
	end
end
return R
]==])
put([==[ServerScriptService]==],{[==[OrbitalShiftVR]==]},[==[WorldBuilder]==],[==[ModuleScript]==],[==[-- Original primitive-built station; no Toolbox code or runtime asset dependencies.
local Collection=game:GetService("CollectionService")
local W={}
local C={Ivory=Color3.fromRGB(220,219,202), Navy=Color3.fromRGB(20,36,53), Orange=Color3.fromRGB(246,126,49),
	Cyan=Color3.fromRGB(88,221,223), Green=Color3.fromRGB(112,228,158), Red=Color3.fromRGB(239,85,69), Metal=Color3.fromRGB(85,104,115)}
W.Colors=C
local root,station,items
local function part(parent,name,size,cf,color,anchored)
	local p=Instance.new("Part"); p.Name=name; p.Size=size; p.CFrame=cf; p.Color=color or C.Ivory
	p.Material=Enum.Material.SmoothPlastic; p.Anchored=anchored~=false; p.TopSurface=Enum.SurfaceType.Smooth; p.BottomSurface=Enum.SurfaceType.Smooth
	p.CustomPhysicalProperties=PhysicalProperties.new(1,0.5,0,1,1); p.Parent=parent; return p
end
local function tag(p,kind,id)
	Collection:AddTag(p,"OSInteractable"); p:SetAttribute("Kind",kind); p:SetAttribute("Id",id or p.Name); p:SetAttribute("Label",p.Name)
	return p
end
local function sign(parent,name,text,cf,width,height,color)
	local p=part(parent,name,Vector3.new(width,height,0.12),cf,C.Navy)
	p.CanCollide=false; p.CanQuery=false
	local gui=Instance.new("SurfaceGui"); gui.Face=Enum.NormalId.Front; gui.SizingMode=Enum.SurfaceGuiSizingMode.PixelsPerStud; gui.PixelsPerStud=65; gui.LightInfluence=0; gui.Parent=p
	local pad=Instance.new("UIPadding"); pad.PaddingLeft=UDim.new(0,10); pad.PaddingRight=UDim.new(0,10); pad.Parent=gui
	local t=Instance.new("TextLabel"); t.Name="Text"; t.Size=UDim2.fromScale(1,1); t.BackgroundTransparency=1
	t.Text=text; t.TextColor3=color or C.Ivory; t.Font=Enum.Font.GothamMedium; t.TextScaled=true; t.TextWrapped=true; t.Parent=gui
	return p
end
local function rail(cf,len,name)
	local p=tag(part(items,name or "Handrail",Vector3.new(len or 4,0.24,0.24),cf,C.Orange),"Rail")
	p.Material=Enum.Material.Metal
	for _,x in {-p.Size.X/2+0.15,p.Size.X/2-0.15} do
		part(station,"RailBracket",Vector3.new(0.18,0.45,0.3),cf*CFrame.new(x,-0.3,0),C.Metal)
	end
	return p
end
local function loose(id,kind,pos,size,color,density)
	local p=tag(part(items,id,size,CFrame.new(pos),color,false),"Loose",id)
	p:SetAttribute("ItemType",kind); p:SetAttribute("Home",p.CFrame); p:SetAttribute("Docked",false)
	p.CustomPhysicalProperties=PhysicalProperties.new(density or 0.8,0.5,0.05,1,1)
	p.Material=Enum.Material.Metal
	local a=Instance.new("Attachment"); a.Name="CableAttachment"; a.Parent=p
	local stripe=part(p,"IdentityStripe",Vector3.new(size.X+0.02,0.12,size.Z+0.02),p.CFrame,color)
	stripe.CanCollide=false; stripe.CanQuery=false; stripe.Massless=true; stripe.Anchored=false
	local weld=Instance.new("WeldConstraint"); weld.Part0=p; weld.Part1=stripe; weld.Parent=stripe
	return p
end
local function socket(id,kind,pos,color,stage)
	local p=tag(part(items,id,Vector3.new(1.55,1.8,0.4),CFrame.new(pos),C.Navy),"Socket",id)
	p:SetAttribute("Accepts",kind); p:SetAttribute("MinStage",stage or 0); p:SetAttribute("Occupied",false)
	local a=Instance.new("Attachment"); a.Name="Dock"; a.Position=Vector3.new(0,0,0.7); a.Parent=p
	for _,x in {-0.85,0.85} do part(station,"DockGuide",Vector3.new(0.1,1.8,0.6),p.CFrame*CFrame.new(x,0,0.2),color) end
	sign(station,id.."Label",id:upper(),p.CFrame*CFrame.new(0,1.45,0.05)*CFrame.Angles(0,math.pi,0),3,0.65,color)
	return p
end
local function machine(id,pos,kind,minStage)
	local base=part(station,id.."Base",Vector3.new(2,2.3,0.45),CFrame.new(pos),C.Navy)
	local moving=tag(part(items,id,if kind=="Wheel" then Vector3.new(1.6,1.6,0.3) else Vector3.new(0.3,1.65,0.3),base.CFrame*CFrame.new(0,0,0.5),C.Orange,false),kind,id)
	moving:SetAttribute("MinStage",minStage or 0)
	if kind=="Wheel" then moving.Shape=Enum.PartType.Cylinder; moving.Size=Vector3.new(0.3,1.7,1.7); moving.CFrame*=CFrame.Angles(0,math.pi/2,0) end
	local a=Instance.new("Attachment"); a.Name="Pivot"; a.CFrame=base.CFrame:ToObjectSpace(moving.CFrame); a.Parent=base
	local b=Instance.new("Attachment"); b.Parent=moving
	-- Wheel local X is its axle. Lever rotates around the panel normal (world Z).
	if kind=="Lever" then a.CFrame=CFrame.new(0,-0.6,0.5)*CFrame.Angles(0,math.pi/2,0); b.CFrame=CFrame.new(0,-0.6,0)*CFrame.Angles(0,math.pi/2,0) end
	local h=Instance.new("HingeConstraint"); h.Name="Mechanism"; h.Attachment0=a; h.Attachment1=b
	h.ActuatorType=Enum.ActuatorType.Servo; h.AngularSpeed=1.5; h.ServoMaxTorque=800; h.LimitsEnabled=true
	h.LowerAngle=if kind=="Wheel" then -90 else -35; h.UpperAngle=if kind=="Wheel" then 90 else 35
	h.TargetAngle=if kind=="Lever" then -35 else 0; h.Parent=moving
	moving:SetAttribute("Setpoint",h.TargetAngle)
	sign(station,id.."Label",id:upper(),base.CFrame*CFrame.new(0,1.8,0.05)*CFrame.Angles(0,math.pi,0),3.3,0.6,C.Orange)
	return moving
end
local function button(id,pos,label,stage)
	local p=tag(part(items,id,Vector3.new(0.8,0.8,0.25),CFrame.new(pos),C.Orange),"Button",id)
	p:SetAttribute("MinStage",stage or 0); p:SetAttribute("Rest",p.CFrame)
	sign(station,id.."Label",label,p.CFrame*CFrame.new(0,0.9,0)*CFrame.Angles(0,math.pi,0),3,0.65)
	return p
end
local function door(id,z,width)
	local anchor=part(station,id.."Frame",Vector3.new(width+1,0.6,0.8),CFrame.new(0,11.5,z),C.Orange)
	local d=tag(part(items,id,Vector3.new(width,10,0.65),CFrame.new(0,5.8,z),C.Navy,false),"Door",id)
	local a=Instance.new("Attachment"); a.CFrame=CFrame.new(0,-5.7,0)*CFrame.Angles(0,0,math.pi/2); a.Parent=anchor
	local b=Instance.new("Attachment"); b.CFrame=CFrame.Angles(0,0,math.pi/2); b.Parent=d
	local slide=Instance.new("PrismaticConstraint"); slide.Name="Mechanism"; slide.Attachment0=a; slide.Attachment1=b
	slide.LimitsEnabled=true; slide.LowerLimit=0; slide.UpperLimit=10.5; slide.ActuatorType=Enum.ActuatorType.Servo
	slide.Speed=4; slide.ServoMaxForce=25000; slide.TargetPosition=0; slide.Parent=d
	d:SetAttribute("Open",false)
	for _,x in {-width/2+0.3,width/2-0.3} do
		local p=part(d,"WarningStripe",Vector3.new(0.15,9.5,0.69),d.CFrame*CFrame.new(x,0,0),C.Orange,false)
		p.Massless=true; p.CanCollide=false; p.CanQuery=false
		local weld=Instance.new("WeldConstraint"); weld.Part0=d; weld.Part1=p; weld.Parent=p
	end
	return d
end
local function room(name,z,length,width)
	local f=Instance.new("Folder"); f.Name=name; f.Parent=station
	part(f,"Deck",Vector3.new(width,0.8,length),CFrame.new(0,-0.4,z),C.Navy)
	part(f,"Ceiling",Vector3.new(width,0.45,length),CFrame.new(0,12.2,z),C.Ivory)
	for _,x in {-width/2,width/2} do
		part(f,"HullLower",Vector3.new(0.55,3,length),CFrame.new(x,1.5,z),C.Ivory)
		part(f,"HullUpper",Vector3.new(0.55,3,length),CFrame.new(x,10.5,z),C.Ivory)
		local pane=part(f,"ObservationGlass",Vector3.new(0.2,6,length),CFrame.new(x,6,z),C.Cyan); pane.Transparency=0.82; pane.Material=Enum.Material.Glass
		for k=-length/2+2,length/2-1,5 do
			part(f,"Rib",Vector3.new(0.8,12,0.5),CFrame.new(x,6,z+k),C.Metal)
			rail(CFrame.new(x*0.91,4.8,z+k)*CFrame.Angles(0,math.pi/2,0),4)
		end
	end
	for k=-length/2+1,length/2-1,4 do
		part(f,"DeckTile",Vector3.new(width-1,0.06,3.85),CFrame.new(0,0.04,z+k),C.Metal)
		part(f,"GuideLine",Vector3.new(0.12,0.07,3),CFrame.new(0,0.1,z+k),C.Orange)
	end
	for _,x in {-4,4} do
		local strip=part(f,"LightStrip",Vector3.new(0.15,0.1,length-2),CFrame.new(x,11.85,z),C.Ivory); strip.Material=Enum.Material.Neon
	end
	for k=-length/2+3,length/2-1,5 do rail(CFrame.new(-2.6,5.1,z+k),4); rail(CFrame.new(2.6,5.1,z+k),4) end
	-- The middle rails form a continuous reachable route even for seated players.
	part(f,"UtilityPipe",Vector3.new(0.35,0.35,length),CFrame.new(-width/2+1,10,z),C.Orange)
	task.wait()
	return f
end
function W.build(trainingOnly)
	root=workspace:FindFirstChild("OrbitalShiftVR")
	if root then
		if root:GetAttribute("BuiltPhase") then return root end
		-- A source-controlled XML place can include an anchored edit preview.
		-- Replace only our preview namespace with the fully attributed runtime world.
		root:Destroy()
	end
	root=Instance.new("Model"); root.Name="OrbitalShiftVR"; root.ModelStreamingMode=Enum.ModelStreamingMode.Persistent; root.Parent=workspace
	station=Instance.new("Folder"); station.Name="Station"; station.Parent=root
	items=Instance.new("Folder"); items.Name="Interactables"; items.Parent=root
	for _,name in {"Rigs","Checkpoints"} do local f=Instance.new("Folder"); f.Name=name; f.Parent=root end
	workspace.Gravity=0
	local lighting=game:GetService("Lighting"); lighting.ClockTime=0; lighting.Brightness=2
	lighting.GlobalShadows=false; lighting.Ambient=Color3.fromRGB(150,157,168); lighting.OutdoorAmbient=Color3.fromRGB(130,140,155)
	lighting.EnvironmentDiffuseScale=0.6; lighting.EnvironmentSpecularScale=0.5
	room("Training",3,24,22)
	rail(CFrame.new(0,5.7,4.8),3.5,"FirstHandrail")
	part(station,"AftBulkhead",Vector3.new(22,12,0.5),CFrame.new(0,6,15),C.Ivory)
	sign(station,"Title","ORBITAL\nSHIFT",CFrame.new(0,8,-8)*CFrame.Angles(0,math.pi,0),8,3,C.Orange)
	sign(station,"Welcome","ZERO GRAVITY / TWO HANDS / ONE CREW\nGrab orange. Carry cyan. Recover with H.",CFrame.new(-5.7,7.6,-4)*CFrame.Angles(0,math.pi,0),7,1.5)
	-- Panels face +Z: Front surface is local -Z, hence a 180° yaw.
	local cell=loose("PracticeCell","Practice",Vector3.new(3.2,5.7,4),Vector3.new(0.6,1,0.6),C.Cyan)
	local dock=socket("PracticeDock","Practice",Vector3.new(3.2,5.7,0),C.Cyan)
	button("SkipTutorial",Vector3.new(-3,6,0),"SKIP / REPEAT IN MENU",0)
	root:SetAttribute("BuiltPhase","Training")
	if not trainingOnly then W.extend() end
	return root
end
function W.extend()
	root=workspace:FindFirstChild("OrbitalShiftVR"); station=root.Station; items=root.Interactables
	if root:GetAttribute("BuiltPhase")=="Complete" then return end
	room("Maintenance",-24,30,22); room("Observatory",-54,30,24); room("Airlock",-77,16,16)
	for _,x in {-8,8} do part(station,"PowerBulkhead",Vector3.new(6,12,0.8),CFrame.new(x,6,-39),C.Ivory) end
	door("PowerDoor",-39,10)
	loose("CellA","Energy",Vector3.new(-4.5,5.8,-17),Vector3.new(0.65,1.15,0.65),C.Orange)
	loose("CellB","Energy",Vector3.new(4.5,6,-27),Vector3.new(0.65,1.15,0.65),C.Orange)
	socket("PowerA","Energy",Vector3.new(-3,5.8,-33),C.Orange,1); socket("PowerB","Energy",Vector3.new(3,5.8,-33),C.Orange,1)
	machine("MainLever",Vector3.new(0,6,-33),"Lever",1)
	sign(station,"PowerSign","01  /  MAINTENANCE\nTWO CELLS. ONE SWITCH.",CFrame.new(0,9.5,-34)*CFrame.Angles(0,math.pi,0),9,1.7,C.Orange)
	local p1=loose("CableEndA","CableA",Vector3.new(-4,5.5,-46),Vector3.new(0.55,0.7,0.55),C.Cyan)
	local p2=loose("CableEndB","CableB",Vector3.new(3.5,5.5,-48),Vector3.new(0.55,0.7,0.55),C.Cyan)
	local cable=Instance.new("Beam"); cable.Name="SignalCable"; cable.Attachment0=p1.CableAttachment; cable.Attachment1=p2.CableAttachment
	cable.Width0=0.09; cable.Width1=0.09; cable.CurveSize0=1.5; cable.CurveSize1=-1.5; cable.Segments=8
	cable.Color=ColorSequence.new(C.Cyan); cable.FaceCamera=true; cable.Parent=p1
	socket("CableSource","CableA",Vector3.new(-4,5.5,-52),C.Cyan,2); socket("CableReceiver","CableB",Vector3.new(4,5.5,-57),C.Cyan,2)
	machine("YawWheel",Vector3.new(-1.8,5.8,-62),"Wheel",2); machine("PitchWheel",Vector3.new(1.8,5.8,-62),"Wheel",2)
	sign(station,"SignalReadout","SIGNAL 00%\nTARGET 35° / −20°",CFrame.new(0,8.7,-63)*CFrame.Angles(0,math.pi,0),7.5,1.8,C.Cyan)
	local mast=part(station,"AntennaPedestal",Vector3.new(0.5,3,0.5),CFrame.new(8,13,-56),C.Metal)
	local dish=part(items,"AntennaDish",Vector3.new(4,0.3,4),CFrame.new(8,15,-56),C.Ivory); dish.Shape=Enum.PartType.Cylinder
	part(station,"TargetBeacon",Vector3.new(1.5,1.5,1.5),CFrame.new(32,28,-96),C.Cyan).Material=Enum.Material.Neon
	for _,z in {-69,-85} do
		for _,x in {-6.5,6.5} do part(station,"LockBulkhead",Vector3.new(3,12,0.8),CFrame.new(x,6,z),C.Ivory) end
	end
	door("InnerHatch",-69,10); door("OuterHatch",-85,10)
	button("InnerControl",Vector3.new(-3,5.6,-67),"INNER HATCH",3)
	button("InnerControlInside",Vector3.new(-5.7,5.6,-73),"INNER HATCH",3)
	button("Equalize",Vector3.new(3,5.6,-78),"EQUALIZE / REPRESSURIZE",3)
	button("TetherClip",Vector3.new(-3,5.6,-79),"CLIP SAFETY TETHER",3)
	machine("OuterWheel",Vector3.new(0,5.8,-82),"Wheel",3)
	socket("ResearchDock","Research",Vector3.new(4.8,5.8,-80),C.Green,3)
	sign(station,"EvaSign","03  /  EVA RECOVERY\nSEAL → EQUALIZE → TETHER → OPEN",CFrame.new(0,9,-81)*CFrame.Angles(0,math.pi,0),10,1.3,C.Orange)
	part(station,"ExteriorDeck",Vector3.new(14,0.6,34),CFrame.new(0,-0.3,-102),C.Navy)
	for _,x in {-6,6} do
		for z=-88,-116,-4 do rail(CFrame.new(x,4.8,z)*CFrame.Angles(0,math.pi/2,0),3.8) end
	end
	for z=-88,-116,-4 do rail(CFrame.new(0,5,-z*-1),4) end
	local crate=loose("ResearchCase","Research",Vector3.new(0,5.8,-110),Vector3.new(1.15,1.1,1.1),C.Green,5)
	crate:SetAttribute("Label","RESEARCH / HEAVY CASE")
	part(station,"ResearchCradle",Vector3.new(3,0.5,3),CFrame.new(0,4.6,-110),C.Metal)
	sign(station,"OutsideSign","K-07 / RESEARCH ARRAY\nKEEP YOUR LINE ATTACHED",CFrame.new(0,8,-117)*CFrame.Angles(0,math.pi,0),10,1.4,C.Green)
	local space=Instance.new("Folder"); space.Name="OrbitalView"; space.Parent=station
	local planet=part(space,"Pelagos",Vector3.new(160,160,160),CFrame.new(145,-105,-200),Color3.fromRGB(48,117,159)); planet.Shape=Enum.PartType.Ball; planet.CanCollide=false; planet.CanQuery=false
	local cap=part(space,"PolarClouds",Vector3.new(146,146,146),CFrame.new(149,-98,-201),Color3.fromRGB(150,199,204)); cap.Shape=Enum.PartType.Ball; cap.CanCollide=false; cap.CanQuery=false
	local rng=Random.new(10718)
	for i=1,46 do
		local star=part(space,"Star",Vector3.one*rng:NextNumber(0.2,0.6),CFrame.new(rng:NextNumber(-260,260),rng:NextNumber(50,200),rng:NextNumber(-300,-150)),C.Ivory)
		star.Material=Enum.Material.Neon; star.CanCollide=false; star.CanQuery=false
	end
	local Config=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Config)
	for i,cf in Config.Checkpoints do
		local checkpoint=part(root.Checkpoints,"Checkpoint"..i,Vector3.one,cf,C.Green); checkpoint.Transparency=1; checkpoint.CanCollide=false; checkpoint.CanQuery=false
	end
	root:SetAttribute("BuiltPhase","Complete")
	return root
end
return W
]==])

-- ORBITAL SHIFT VR: namespace-only, repeatable source installer. Run in EDIT mode of an EMPTY place.
assert(not game:GetService('RunService'):IsRunning(),'Stop Play before installing')
assert(game.PlaceId==0 or game:GetAttribute('OrbitalShiftProject'),'Use an unsaved empty place or the explicitly approved Orbital Shift place')
local function folder(parent,name) local f=parent:FindFirstChild(name); if not f then f=Instance.new('Folder'); f.Name=name; f.Parent=parent end; return f end
local function put(service,names,name,class,source) local f=game:GetService(service); for _,n in names do f=folder(f,n) end; local s=f:FindFirstChild(name); if s and s.ClassName~=class then error('Conflicting class: '..name) end; if not s then s=Instance.new(class); s.Name=name end; s.Source=source; s.Parent=f end
put([==[StarterPlayer]==],{[==[StarterPlayerScripts]==],[==[OrbitalShiftVR]==]},[==[Bootstrap]==],[==[LocalScript]==],[==[local Players=game:GetService("Players")
local Run=game:GetService("RunService")
local UIS=game:GetService("UserInputService")
local player=Players.LocalPlayer
local namespace=game.ReplicatedStorage:WaitForChild("OrbitalShiftVR")
local Config=require(namespace.Shared.Config)
local tracking=require(script.Parent.VRTrackingController)
local camera=require(script.Parent.CameraController)
local locomotion=require(script.Parent.LocomotionController)
local hands=require(script.Parent.HandController)
local interactions=require(script.Parent.InteractionController)
local input=require(script.Parent.InputAdapter)
local ui=require(script.Parent.UIController)
local avatars=require(script.Parent.RemoteAvatarController)
local remotes=namespace:WaitForChild("Remotes")
local model=player.Character or player.CharacterAdded:Wait()
local root=model:WaitForChild("HumanoidRootPart")
local function disableDefault(module)
	if module.Name=="PlayerModule" and module:IsA("ModuleScript") then pcall(function() require(module):GetControls():Disable() end) end
end
local defaultModule=player.PlayerScripts:FindFirstChild("PlayerModule"); if defaultModule then disableDefault(defaultModule) end
player.PlayerScripts.ChildAdded:Connect(disableDefault)
tracking.init(root); camera.init(tracking); locomotion.init(root,tracking,model)
local function clear()
	locomotion.reset(); remotes.Action:FireServer({action="Recenter"}); tracking.resetHands()
	if interactions.desired then table.clear(interactions.desired) end
end
tracking.onReset=clear; locomotion.onOverlap=clear
local toggled={}
input.init(function(action,value)
	if action=="Menu" and value then ui.open(not ui.opened); return end
	if action=="Recover" and value then remotes.Action:FireServer({action="Recover"}); return end
	if action=="UseLeft" or action=="UseRight" then
		local side=if action=="UseLeft" then "Left" else "Right"
		if value and ui.vrClick(side) then return end
		if ui.opened then return end
		interactions.use(side,value,input:reverse()); return
	end
	if ui.opened then return end
	if action=="SelectHand" and value then
		input.selected=if input.selected=="Both" then "Left" elseif input.selected=="Left" then "Right" else "Both"; ui.notice("HAND CONTROL / "..input.selected:upper())
	elseif action=="GrabLeft" or action=="GrabRight" then
		local side=if action=="GrabLeft" then "Left" else "Right"
		if ui.toggleGrab then if not value then return end; toggled[side]=not toggled[side]; value=toggled[side] end
		input.extending[side]=value
		-- Desktop can extend each hand independently before acquisition.
		if value and not interactions.candidates[side] and not tracking.vr then
			tracking.offsets[side]=Vector3.new(if side=="Left" then -0.35 else 0.35,-0.25,-3.4)
			tracking.sample(0,input,locomotion.grips,false); interactions.scan()
		end
		interactions.grab(side,value)
	elseif action=="SnapLeft" and value then clear(); tracking.snap(1)
	elseif action=="SnapRight" and value then clear(); tracking.snap(-1)
	elseif action=="Push" and value then
		local side=if interactions.candidates[ui.dominant] then ui.dominant else (if ui.dominant=="Right" then "Left" else "Right")
		local part=interactions.candidates[side]; if part then remotes.Action:FireServer({action="Push",side=side,part=part}) end
	end
end,tracking)
ui.init(tracking,input,locomotion,remotes)
interactions.init(tracking,locomotion,remotes,ui); hands.init(model,tracking,locomotion.grips); avatars.init(remotes.Pose)
input.onFocusLost=function() ui.open(true) end
remotes.Feedback.OnClientEvent:Connect(function(data)
	if type(data)~="table" then return end
	interactions.feedback(data)
	if data.type=="Notice" then ui.notice(data.text)
	elseif data.type=="Recover" then
		locomotion.reset(); tracking.yaw=0; tracking.pitch=0; tracking.recenter(); ui.flash()
		locomotion.lastSafe=data.cf
	end
end)
local lastStage=namespace.State:GetAttribute("Stage") or 0
namespace.State:GetAttributeChangedSignal("Stage"):Connect(function()
	local stage=namespace.State:GetAttribute("Stage"); if stage==4 and lastStage~=4 then ui.open(true) end; lastStage=stage
end)
local sendTime,scanTime,seq=0,0,0
Run:BindToRenderStep("OrbitalShiftTracking",Enum.RenderPriority.Camera.Value+1,function(dt)
	tracking.sample(dt,input,locomotion.grips,ui.opened); camera.render(); hands.render(dt); avatars.render(dt); ui.render()
	sendTime+=dt; scanTime+=dt
	if scanTime>=0.075 then interactions.scan(); scanTime=0 end
	if sendTime>=1/Config.Physics.PoseHz then
		sendTime=0; seq+=1
		remotes.Pose:FireServer({seq=seq,head=tracking.head,left=tracking.left,right=tracking.right,tracked=tracking.ready})
	end
end)
Run.PreSimulation:Connect(function(dt) locomotion.step(dt,ui.opened) end)
remotes.Action:FireServer({action="Snapshot"})
print("[OrbitalShiftVR] Client ready / "..(tracking.vr and "VR" or "Desktop").." / "..input.engine)
]==])
put([==[StarterPlayer]==],{[==[StarterPlayerScripts]==],[==[OrbitalShiftVR]==]},[==[CameraController]==],[==[ModuleScript]==],[==[local C={}
function C.init(tracking)
	C.tracking=tracking
	local camera=workspace.CurrentCamera
	camera.CameraType=Enum.CameraType.Scriptable; camera.HeadLocked=true; camera.VRTiltAndRollEnabled=false; camera.FieldOfView=78
end
function C.render()
	local camera=workspace.CurrentCamera; local t=C.tracking
	camera.CameraType=Enum.CameraType.Scriptable; camera.CFrame=t.origin
	camera.Focus=CFrame.new((t.head or t.origin).Position+(t.head or t.origin).LookVector*12)
	-- HeadLocked adds the scaled physical head pose once. origin must not contain that pose.
	C.renderedHead=camera:GetRenderCFrame()
end
return C
]==])
put([==[StarterPlayer]==],{[==[StarterPlayerScripts]==],[==[OrbitalShiftVR]==]},[==[HandController]==],[==[ModuleScript]==],[==[local Config=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Config)
local H={}
function H.init(model,tracking,grips)
	H.model=model; H.tracking=tracking; H.grips=grips; H.hands={}; H.visuals={}
	local filter=RaycastParams.new(); filter.FilterType=Enum.RaycastFilterType.Exclude; filter.FilterDescendantsInstances={model}; filter.RespectCanCollide=true; filter.CollisionGroup="OSHand"; H.filter=filter
	for _,side in {"Left","Right"} do
		H.hands[side]={part=model:WaitForChild(side.."Hand"),target=model:WaitForChild(side.."Target"),safe=model:WaitForChild(side.."Hand").CFrame}
		local a=Instance.new("Attachment"); a.Parent=H.hands[side].part
		local shoulder=Instance.new("Attachment"); shoulder.Position=Vector3.new(if side=="Left" then -0.5 else 0.5,0.5,0); shoulder.Parent=model.HumanoidRootPart
		local arm=Instance.new("Beam"); arm.Attachment0=shoulder; arm.Attachment1=a; arm.Width0=0.18; arm.Width1=0.12
		arm.Color=ColorSequence.new(Color3.fromRGB(185,194,193)); arm.FaceCamera=true; arm.Transparency=NumberSequence.new(0.25); arm.Parent=a
	end
end
function H.render(dt)
	local t=H.tracking; if not t.ready then return end
	H.overlapClock=(H.overlapClock or 0)+(dt or 0)
	local inspectOverlap=H.overlapClock>0.1; if inspectOverlap then H.overlapClock=0 end
	local held={}
	for side,hand in H.hands do
		if inspectOverlap then
			local params=OverlapParams.new(); params.FilterType=Enum.RaycastFilterType.Include; params.FilterDescendantsInstances={workspace.OrbitalShiftVR.Station}; params.RespectCanCollide=true
			if #workspace:GetPartsInPart(hand.part,params)==0 then hand.safe=hand.part.CFrame
			elseif (hand.part.Position-hand.safe.Position).Magnitude<6 then hand.part.CFrame=hand.safe; hand.part.AssemblyLinearVelocity=Vector3.zero end
		end
		local target=if side=="Left" then t.left else t.right
		local delta=target.Position-hand.part.Position
		if delta.Magnitude>0.005 then
			local hit=workspace:Spherecast(hand.part.Position,Config.Physics.HandRadius,delta,H.filter)
			if hit then target=target.Rotation+(hand.part.Position+delta.Unit*math.max(0,hit.Distance-0.02)) end
		end
		hand.target.CFrame=target
		local grip=H.grips[side]
		if grip and grip.kind=="Loose" and grip.part.Parent then
			local record=held[grip.part] or {sum=Vector3.zero,n=0,rotation=nil}; held[grip.part]=record
			local cf=target*grip.offset; record.sum+=cf.Position; record.n+=1; record.rotation=record.rotation or cf.Rotation
		end
	end
	for object,r in held do local folder=object:FindFirstChild("ActiveGrip"); if folder and folder:FindFirstChild("GripTarget") then folder.GripTarget.CFrame=r.rotation+r.sum/r.n end end
end
return H
]==])
put([==[StarterPlayer]==],{[==[StarterPlayerScripts]==],[==[OrbitalShiftVR]==]},[==[InputAdapter]==],[==[ModuleScript]==],[==[local UIS=game:GetService("UserInputService")
local Config=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Config)
local I={states={},extending={},stick=Vector2.zero,turnNeutral=true,last="No input yet",profile="Quest",sensitivity=1,selected="Both"}
function I:emit(name,value)
	self.states[name]=value; self.last=name.." / "..tostring(value)
	if self.callback then self.callback(name,value) end
end
function I:bind(profile)
	self.profile=profile or self.profile
	if self.context then self.context:Destroy() end
	local bindings=Config.Profiles[self.profile]
	local desktop={GrabLeft="Q",GrabRight="E",UseLeft="Z",UseRight="C",Menu="Tab",Recover="H",Push="Space",SnapLeft="J",SnapRight="L",SelectHand="V"}
	local ok,context=pcall(Instance.new,"InputContext")
	if ok then
		self.engine="Input Action System"; self.context=context; context.Name="OrbitalShiftActions"; context.Priority=300; context.Sink=true; context.Parent=game.Players.LocalPlayer.PlayerGui
		for name,key in desktop do
			local a=Instance.new("InputAction"); a.Name=name; a.Type=Enum.InputActionType.Bool; a.Parent=context
			local b=Instance.new("InputBinding"); b.Name="Keyboard"; b.KeyCode=Enum.KeyCode[key]; b.Parent=a
			if bindings[name] then local controller=Instance.new("InputBinding"); controller.Name="Controller"; controller.KeyCode=Enum.KeyCode[bindings[name]]; controller.Parent=a end
			a.StateChanged:Connect(function(value) self:emit(name,value) end)
		end
		context.Enabled=true
	else
		self.engine="ContextActionService compatibility adapter"
		local CAS=game:GetService("ContextActionService")
		for name,key in desktop do
			local keys={Enum.KeyCode[key]}; if bindings[name] then table.insert(keys,Enum.KeyCode[bindings[name]]) end
			CAS:BindActionAtPriority("OS"..name,function(_,state)
				if state==Enum.UserInputState.Begin then self:emit(name,true) elseif state==Enum.UserInputState.End or state==Enum.UserInputState.Cancel then self:emit(name,false) end
				return Enum.ContextActionResult.Sink
			end,false,300,table.unpack(keys))
		end
	end
end
function I.init(callback,tracking)
	I.callback=callback; I.tracking=tracking; I:bind("Quest")
	UIS.InputChanged:Connect(function(input,processed)
		if input.KeyCode==Enum.KeyCode.Thumbstick2 then
			local x=input.Position.X
			if math.abs(x)<0.25 then I.turnNeutral=true
			elseif math.abs(x)>0.7 and I.turnNeutral then I.turnNeutral=false; I:emit(if x>0 then "SnapRight" else "SnapLeft",true) end
		elseif input.KeyCode==Enum.KeyCode.Thumbstick1 then I.stick=Vector2.new(input.Position.X,input.Position.Y)
		elseif input.UserInputType==Enum.UserInputType.MouseMovement and not tracking.vr and not I.menu then
			tracking.yaw-=input.Delta.X*0.003*I.sensitivity
			tracking.pitch=math.clamp(tracking.pitch-input.Delta.Y*0.003*I.sensitivity,-1.2,1.2)
		end
		I.raw=input.KeyCode.Name.." "..tostring(input.Position)
	end)
	UIS.WindowFocusReleased:Connect(function() if I.onFocusLost then I.onFocusLost() end end)
end
function I:handAxis()
	if UIS:GetFocusedTextBox() then return Vector3.zero end
	local function k(code) return if UIS:IsKeyDown(code) then 1 else 0 end
	return Vector3.new(k(Enum.KeyCode.A)-k(Enum.KeyCode.D),k(Enum.KeyCode.R)-k(Enum.KeyCode.F),k(Enum.KeyCode.W)-k(Enum.KeyCode.S))
end
function I:reverse() return UIS:IsKeyDown(Enum.KeyCode.LeftShift) or self.stick.Y< -0.4 end
return I
]==])
put([==[StarterPlayer]==],{[==[StarterPlayerScripts]==],[==[OrbitalShiftVR]==]},[==[InteractionController]==],[==[ModuleScript]==],[==[local Collection=game:GetService("CollectionService")
local Haptic=game:GetService("HapticService")
local U=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Util)
local I={candidates={},highlights={},pending={},using={},desired={}}
function I.init(tracking,locomotion,remotes,ui)
	I.tracking=tracking; I.locomotion=locomotion; I.remotes=remotes; I.ui=ui
	I.parts={}; for _,p in Collection:GetTagged("OSInteractable") do if p:IsDescendantOf(workspace.OrbitalShiftVR) then table.insert(I.parts,p) end end
	Collection:GetInstanceAddedSignal("OSInteractable"):Connect(function(p) if p:IsDescendantOf(workspace.OrbitalShiftVR) then table.insert(I.parts,p) end end)
	for _,side in {"Left","Right"} do
		local h=Instance.new("Highlight"); h.Name=side.."Focus"; h.FillTransparency=0.88; h.OutlineColor=if side=="Left" then Color3.fromRGB(88,221,223) else Color3.fromRGB(246,126,49)
		h.DepthMode=Enum.HighlightDepthMode.Occluded; h.Parent=game.Players.LocalPlayer.PlayerGui; I.highlights[side]=h
	end
end
function I.pulse(side)
	local motor=if side=="Left" then Enum.VibrationMotor.LeftHand else Enum.VibrationMotor.RightHand
	pcall(function()
		if Haptic:IsVibrationSupported(Enum.UserInputType.Gamepad1) and Haptic:IsMotorSupported(Enum.UserInputType.Gamepad1,motor) then
			Haptic:SetMotor(Enum.UserInputType.Gamepad1,motor,0.18); task.delay(0.055,function() Haptic:SetMotor(Enum.UserInputType.Gamepad1,motor,0) end)
		end
	end)
end
function I.scan()
	for _,side in {"Left","Right"} do
		local cf=if side=="Left" then I.tracking.left else I.tracking.right
		local nearest=nil; local distance=0.95
		for _,p in I.parts do
			if not p.Parent or p:GetAttribute("Docked") then continue end
			local d=(U.surface(p,cf.Position)-cf.Position).Magnitude
			if d<distance then distance=d; nearest=p end
		end
		I.candidates[side]=nearest; I.highlights[side].Adornee=nearest; I.highlights[side].Enabled=nearest~=nil
	end
	local candidate=I.candidates.Right or I.candidates.Left
	if I.ui then I.ui.target=candidate and ((candidate:GetAttribute("Label") or candidate.Name).."  /  "..(candidate:GetAttribute("Kind") or "")) or "Find an orange handrail" end
end
function I.grab(side,down)
	I.desired[side]=down
	if down then
		local p=I.candidates[side]; if p then I.pending[side]=p; I.remotes.Action:FireServer({action="Grab",side=side,part=p}) end
	else
		I.remotes.Action:FireServer({action="Release",side=side}); I.locomotion.grips[side]=nil; I.pending[side]=nil
		if not I.tracking.vr then I.tracking.resetHands() end
	end
end
function I.use(side,down,reverse)
	local g=I.locomotion.grips[side]
	local p=if down then (g and g.part or I.candidates[side]) else I.using[side]
	if p or not down then I.remotes.Action:FireServer({action="Use",side=side,part=p,down=down,reverse=reverse}) end
	I.using[side]=if down then p else nil
end
function I.feedback(data)
	if data.type=="Grip" then
		if not I.desired[data.side] then I.remotes.Action:FireServer({action="Release",side=data.side}); return end
		I.locomotion.grips[data.side]={part=data.part,kind=data.kind,anchor=data.anchor,offset=data.offset}; I.pending[data.side]=nil; I.pulse(data.side)
	elseif data.type=="Release" then I.locomotion.grips[data.side]=nil; I.pending[data.side]=nil end
end
return I
]==])
put([==[StarterPlayer]==],{[==[StarterPlayerScripts]==],[==[OrbitalShiftVR]==]},[==[LocomotionController]==],[==[ModuleScript]==],[==[local Config=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Config)
local U=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Util)
local L={grips={},mode="Assisted",speed=1,previous={},lastSafe=nil}
function L.init(root,tracking,model)
	L.root=root; L.tracking=tracking; L.model=model; L.force=root:WaitForChild("HandLocomotion"); L.lastSafe=root.CFrame
	local params=RaycastParams.new(); params.FilterType=Enum.RaycastFilterType.Exclude; params.FilterDescendantsInstances={model}; params.RespectCanCollide=true; params.CollisionGroup="OSBody"; L.cast=params
	local overlap=OverlapParams.new(); overlap.FilterType=Enum.RaycastFilterType.Exclude; overlap.FilterDescendantsInstances={model}; overlap.RespectCanCollide=true; overlap.CollisionGroup="OSBody"; L.overlap=overlap
end
function L.reset()
	L.previous={}; table.clear(L.grips); if L.force then L.force.Force=Vector3.zero end
end
function L.step(dt,paused)
	dt=math.min(dt,0.05); local root=L.root; if not root or not root.Parent then return end
	local velocity=root.AssemblyLinearVelocity; local mass=root.AssemblyMass; local mode=Config.Modes[L.mode]
	local sum=Vector3.zero; local count=0; local carried=0
	for side,grip in L.grips do
		local cf=if side=="Left" then L.tracking.left else L.tracking.right
		if grip.part.Parent and grip.kind=="Rail" and L.tracking.ready and not paused then
			local anchor=grip.part.CFrame:PointToWorldSpace(grip.anchor)
			local error=anchor-cf.Position
			-- Two hands share one bounded solution; no doubled acceleration.
			sum+=error*Config.Physics.PullGain-velocity*Config.Physics.PullDamping; count+=1
		elseif grip.kind=="Loose" and grip.part.Parent then carried+=grip.part.AssemblyMass end
	end
	local force=-velocity*mode.Damping*mass
	if paused or not L.tracking.ready then force=-velocity*mass*5
	elseif count>0 then force+=U.clamp(sum/count,14)*mass/(1+carried*0.04) end
	L.force.Force=U.clamp(force,Config.Physics.BodyForce)
	local maxSpeed=mode.Speed*L.speed/(1+carried*0.015)
	root.AssemblyLinearVelocity=U.clamp(velocity,maxSpeed)
	root.AssemblyAngularVelocity=Vector3.zero
	root.StableHorizon.CFrame=CFrame.Angles(0,L.tracking.yaw,0)
	-- Physics handles contact; sweep guards fast motion before the next simulation step.
	local delta=root.AssemblyLinearVelocity*dt
	if delta.Magnitude>0.001 then
		local hit=workspace:Spherecast(root.Position,Config.Physics.BodyRadius,delta,L.cast)
		if hit and root.AssemblyLinearVelocity:Dot(hit.Normal)<0 then
			root.AssemblyLinearVelocity-=hit.Normal*root.AssemblyLinearVelocity:Dot(hit.Normal)
		end
	end
	-- Shapecasts ignore initial overlap. Recover to a verified clear point when embedded.
	L.overlapTime=(L.overlapTime or 0)+dt
	if L.overlapTime>0.1 then
		L.overlapTime=0
		local embedded=false
		for _,p in workspace:GetPartsInPart(root,L.overlap) do
			if p.Anchored and p.CanCollide and p:GetAttribute("Kind")~="Rail" then embedded=true; break end
		end
		if not embedded then L.lastSafe=root.CFrame
		elseif L.lastSafe and (root.Position-L.lastSafe.Position).Magnitude<15 then
			root.CFrame=L.lastSafe; root.AssemblyLinearVelocity=Vector3.zero; L.reset(); if L.onOverlap then L.onOverlap() end
		end
	end
end
return L
]==])
put([==[StarterPlayer]==],{[==[StarterPlayerScripts]==],[==[OrbitalShiftVR]==]},[==[RemoteAvatarController]==],[==[ModuleScript]==],[==[local A={avatars={}}
function A.init(remote)
	remote.OnClientEvent:Connect(function(id,data)
		if id==game.Players.LocalPlayer.UserId or type(data)~="table" or not data.tracked or not data.head then return end
		local a=A.avatars[id]
		if not a then
			a={seq=-1,parts={}}; A.avatars[id]=a
			for _,key in {"head","left","right"} do
				local p=Instance.new("Part"); p.Name="CrewPose_"..id.."_"..key; p.Shape=Enum.PartType.Ball
				p.Size=Vector3.one*(if key=="head" then 0.85 else 0.4); p.Anchored=true; p.CanCollide=false; p.CanQuery=false; p.Material=Enum.Material.SmoothPlastic
				p.Color=if key=="head" then Color3.fromRGB(220,219,202) elseif key=="left" then Color3.fromRGB(88,221,223) else Color3.fromRGB(246,126,49)
				p.Parent=workspace.CurrentCamera; a.parts[key]=p; p.CFrame=data[key]
			end
		end
		if data.seq<=a.seq then return end
		a.seq=data.seq; a.data=data; a.time=os.clock()
	end)
	game.Players.PlayerRemoving:Connect(function(player)
		local a=A.avatars[player.UserId]; if a then for _,p in a.parts do p:Destroy() end; A.avatars[player.UserId]=nil end
	end)
end
function A.render(dt)
	for _,a in A.avatars do
		if a.data then for key,p in a.parts do p.CFrame=p.CFrame:Lerp(a.data[key],math.min(1,dt*18)); p.Transparency=if os.clock()-a.time>1 then 1 else 0 end end
	end
end
return A
]==])

-- ORBITAL SHIFT VR: namespace-only, repeatable source installer. Run in EDIT mode of an EMPTY place.
assert(not game:GetService('RunService'):IsRunning(),'Stop Play before installing')
assert(game.PlaceId==0 or game:GetAttribute('OrbitalShiftProject'),'Use an unsaved empty place or the explicitly approved Orbital Shift place')
local function folder(parent,name) local f=parent:FindFirstChild(name); if not f then f=Instance.new('Folder'); f.Name=name; f.Parent=parent end; return f end
local function put(service,names,name,class,source) local f=game:GetService(service); for _,n in names do f=folder(f,n) end; local s=f:FindFirstChild(name); if s and s.ClassName~=class then error('Conflicting class: '..name) end; if not s then s=Instance.new(class); s.Name=name end; s.Source=source; s.Parent=f end
put([==[StarterPlayer]==],{[==[StarterPlayerScripts]==],[==[OrbitalShiftVR]==]},[==[UIController]==],[==[ModuleScript]==],[==[local Players=game:GetService("Players")
local UIS=game:GetService("UserInputService")
local Definitions=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Missions)
local UI={opened=false,target="",vignette=0.4,dominant="Right",seated=false,toggleGrab=false,buttons={},ring={}}
local palette={bg=Color3.fromRGB(18,32,47),ink=Color3.fromRGB(230,229,213),orange=Color3.fromRGB(246,126,49),cyan=Color3.fromRGB(88,221,223)}
local function label(parent,name,text,pos,size,fontSize,color)
	local t=Instance.new("TextLabel"); t.Name=name; t.Text=text; t.Position=pos; t.Size=size; t.TextSize=fontSize; t.BackgroundTransparency=1
	t.TextColor3=color or palette.ink; t.TextXAlignment=Enum.TextXAlignment.Left; t.TextYAlignment=Enum.TextYAlignment.Top; t.Font=Enum.Font.GothamMedium; t.TextWrapped=true; t.Parent=parent; return t
end
function UI.init(tracking,input,locomotion,remotes)
	UI.tracking=tracking; UI.input=input; UI.locomotion=locomotion; UI.remotes=remotes
	UI.state=game.ReplicatedStorage.OrbitalShiftVR:WaitForChild("State")
	local gui=Instance.new("ScreenGui"); gui.Name="OrbitalShiftHUD"; gui.IgnoreGuiInset=false; gui.ResetOnSpawn=false; gui.Parent=Players.LocalPlayer.PlayerGui; UI.gui=gui
	UI.title=label(gui,"Mission","ORBITAL SHIFT",UDim2.fromOffset(26,22),UDim2.new(0.7,0,0,28),20,palette.orange)
	UI.objective=label(gui,"Objective","",UDim2.new(0,26,1,-130),UDim2.new(0.7,0,0,78),17)
	UI.hint=label(gui,"Controls","",UDim2.new(0,26,1,-36),UDim2.new(1,-52,0,26),13,palette.cyan)
	UI.status=label(gui,"Flight","",UDim2.new(1,-250,0,25),UDim2.fromOffset(225,100),13,palette.cyan)
	UI.noticeLabel=label(gui,"Notice","",UDim2.new(0.2,0,0.2,0),UDim2.fromScale(0.6,0.15),23,palette.orange); UI.noticeLabel.TextXAlignment=Enum.TextXAlignment.Center
	local dot=Instance.new("Frame"); dot.Name="Aim"; dot.Size=UDim2.fromOffset(4,4); dot.Position=UDim2.fromScale(0.5,0.5); dot.BackgroundColor3=palette.ink; dot.BorderSizePixel=0; dot.Parent=gui
	local fade=Instance.new("Frame"); fade.Name="Fade"; fade.BackgroundColor3=Color3.new(); fade.BackgroundTransparency=1; fade.Size=UDim2.fromScale(1,1); fade.ZIndex=50; fade.Parent=gui; UI.fade=fade
	local menuGui=Instance.new("ScreenGui"); menuGui.Name="OrbitalShiftMenu"; menuGui.ResetOnSpawn=false; menuGui.DisplayOrder=10; menuGui.Parent=Players.LocalPlayer.PlayerGui; UI.menuGui=menuGui
	local frame=Instance.new("Frame"); frame.Name="ComfortMenu"; frame.Size=UDim2.fromOffset(620,570); frame.AnchorPoint=Vector2.new(0.5,0.5); frame.Position=UDim2.fromScale(0.5,0.5); frame.BackgroundColor3=palette.bg; frame.BorderSizePixel=0; frame.Parent=menuGui; UI.frame=frame
	local stroke=Instance.new("UIStroke"); stroke.Color=palette.orange; stroke.Thickness=2; stroke.Parent=frame
	if not tracking.vr then
		local scale=Instance.new("UIScale"); scale.Parent=frame
		local function fit() local size=workspace.CurrentCamera.ViewportSize; scale.Scale=math.min(1,(size.X-28)/620,(size.Y-70)/570) end
		fit(); workspace.CurrentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(fit)
	end
	label(frame,"Brand","ORBITAL SHIFT / CREW CONSOLE",UDim2.fromOffset(24,18),UDim2.fromOffset(570,30),22,palette.orange)
	label(frame,"Subtitle","A station in pieces. Two hands to put it back together.",UDim2.fromOffset(24,54),UDim2.fromOffset(570,34),14)
	UI.menuInfo=label(frame,"Info","",UDim2.fromOffset(24,94),UDim2.fromOffset(570,83),14,palette.cyan)
	local y=190
	local function button(text,x,w,callback)
		local b=Instance.new("TextButton"); b.Name=text:gsub("[^%w]",""); b.Text=text; b.Size=UDim2.fromOffset(w,34); b.Position=UDim2.fromOffset(x,y)
		b.BackgroundColor3=Color3.fromRGB(38,57,74); b.BorderSizePixel=0; b.TextColor3=palette.ink; b.Font=Enum.Font.GothamMedium; b.TextSize=14; b.Parent=frame
		b.Activated:Connect(callback); UI.buttons[b]=callback; return b
	end
	button("START / RESUME",24,278,function() UI.open(false) end)
	button("RECOVER TO CHECKPOINT",316,280,function() remotes.Action:FireServer({action="Recover"}); UI.open(false) end); y+=44
	local mode; mode=button("MODE / ASSISTED",24,278,function() locomotion.mode=if locomotion.mode=="Assisted" then "Inertial" else "Assisted"; mode.Text="MODE / "..locomotion.mode:upper(); remotes.Action:FireServer({action="Mode",value=locomotion.mode}) end)
	local speed; speed=button("SPEED / 100%",316,280,function() locomotion.speed=if locomotion.speed==1 then 0.6 elseif locomotion.speed==0.6 then 0.8 else 1; speed.Text="SPEED / "..math.floor(locomotion.speed*100).."%" end); y+=44
	local profile; profile=button("PROFILE / QUEST",24,278,function() local nextProfile=if input.profile=="Quest" then "Pico / SteamVR" elseif input.profile=="Pico / SteamVR" then "Swapped grips/triggers" else "Quest"; input:bind(nextProfile); profile.Text="PROFILE / "..nextProfile:upper() end)
	local vignette; vignette=button("VIGNETTE / MEDIUM",316,280,function() UI.vignette=if UI.vignette==0.4 then 0.8 elseif UI.vignette==0.8 then 0 else 0.4; vignette.Text="VIGNETTE / "..(if UI.vignette==0 then "OFF" elseif UI.vignette==0.4 then "MEDIUM" else "HIGH") end); y+=44
	button("RECENTER / CALIBRATE",24,278,function() tracking.recenter(); remotes.Action:FireServer({action="Recenter"}) end)
	local seated; seated=button("POSTURE / STANDING",316,280,function() UI.seated=not UI.seated; seated.Text="POSTURE / "..(if UI.seated then "SEATED" else "STANDING"); tracking.recenter() end); y+=44
	local toggle; toggle=button("GRIP / HOLD",24,278,function() UI.toggleGrab=not UI.toggleGrab; toggle.Text="GRIP / "..(if UI.toggleGrab then "TOGGLE" else "HOLD") end)
	local dominant; dominant=button("DOMINANT / RIGHT",316,280,function() UI.dominant=if UI.dominant=="Right" then "Left" else "Right"; dominant.Text="DOMINANT / "..UI.dominant:upper() end); y+=44
	button("RESTORE LOST OBJECTS",24,278,function() remotes.Action:FireServer({action="RestoreObjects"}); UI.notice("Loose objects returned to their racks") end)
	button("RESET THIS CHECKPOINT",316,280,function() remotes.Action:FireServer({action="ResetCheckpoint"}); UI.open(false) end); y+=44
	button("SKIP TRAINING",24,278,function() remotes.Action:FireServer({action="SkipTutorial"}); UI.open(false) end)
	button("RESTART / REPEAT TRAINING",316,280,function() remotes.Action:FireServer({action="Restart"}); UI.open(false) end); y+=44
	local sensitivity=Instance.new("TextButton"); sensitivity.Name="Sensitivity"; sensitivity.Text="LOOK SENSITIVITY / 100%"; sensitivity.Size=UDim2.fromOffset(270,24); sensitivity.Position=UDim2.fromOffset(24,y); sensitivity.BackgroundTransparency=1; sensitivity.TextColor3=palette.ink; sensitivity.TextSize=12; sensitivity.Font=Enum.Font.GothamMedium; sensitivity.Parent=frame
	local function setSensitivity() input.sensitivity=if input.sensitivity==1 then 0.6 elseif input.sensitivity==0.6 then 1.4 else 1; sensitivity.Text="LOOK SENSITIVITY / "..math.floor(input.sensitivity*100).."%" end
	sensitivity.Activated:Connect(setSensitivity); UI.buttons[sensitivity]=setSensitivity; y+=24
	UI.debug=label(frame,"Diagnostic","",UDim2.fromOffset(24,y),UDim2.fromOffset(570,60),12,palette.cyan)
	if tracking.vr then
		menuGui.Enabled=false
		local panel=Instance.new("Part"); panel.Name="OrbitalComfortPanel"; panel.Anchored=true; panel.CanCollide=false; panel.CanQuery=false; panel.Transparency=1; panel.Size=Vector3.new(4.2,3.86,0.01); panel.Parent=workspace.CurrentCamera; UI.panel=panel
		local surface=Instance.new("SurfaceGui"); surface.Name="VRComfort"; surface.Face=Enum.NormalId.Front; surface.CanvasSize=Vector2.new(620,570); surface.AlwaysOnTop=true; surface.LightInfluence=0; surface.Adornee=panel; surface.Parent=Players.LocalPlayer.PlayerGui; UI.surface=surface
		for _,name in {"RayStart","RayEnd"} do
			local p=Instance.new("Part"); p.Name=name; p.Size=Vector3.one*0.03; p.Anchored=true; p.CanCollide=false; p.CanQuery=false; p.Transparency=1; p.Parent=workspace.CurrentCamera
			local a=Instance.new("Attachment"); a.Parent=p; UI[name]=p
		end
		local ray=Instance.new("Beam"); ray.Attachment0=UI.RayStart.Attachment; ray.Attachment1=UI.RayEnd.Attachment; ray.Width0=0.008; ray.Width1=0.015; ray.FaceCamera=true; ray.Color=ColorSequence.new(palette.cyan); ray.Parent=UI.RayStart; UI.ray=ray
		local cover=Instance.new("Part"); cover.Name="HeadsetFade"; cover.Anchored=true; cover.CanCollide=false; cover.CanQuery=false; cover.CastShadow=false; cover.Size=Vector3.new(4,4,0.005); cover.Color=Color3.new(); cover.Transparency=1; cover.Parent=workspace.CurrentCamera; UI.headFade=cover
		frame.Parent=surface; frame.AnchorPoint=Vector2.zero; frame.Position=UDim2.fromOffset(0,0)
		local wrist=panel:Clone(); wrist.Name="WristMissionCard"; wrist.Size=Vector3.new(2,0.9,0.01); wrist.Parent=workspace.CurrentCamera; UI.wrist=wrist
		local card=Instance.new("SurfaceGui"); card.Face=Enum.NormalId.Front; card.CanvasSize=Vector2.new(600,270); card.AlwaysOnTop=true; card.Adornee=wrist; card.Parent=Players.LocalPlayer.PlayerGui
		local background=Instance.new("Frame"); background.Size=UDim2.fromScale(1,1); background.BackgroundColor3=palette.bg; background.Parent=card
		UI.wristText=label(background,"Mission","",UDim2.fromOffset(20,20),UDim2.new(1,-40,1,-40),28,palette.ink)
		for i=1,24 do
			local p=Instance.new("Part"); p.Name="ComfortVignette"; p.Anchored=true; p.CanCollide=false; p.CanQuery=false; p.CanTouch=false; p.CastShadow=false; p.Color=Color3.new(); p.Material=Enum.Material.SmoothPlastic
			p.Size=Vector3.new(0.4,0.7,0.01); p.Transparency=1; p.Parent=workspace.CurrentCamera; UI.ring[i]=p
		end
	end
	UI.open(true)
end
function UI.open(value)
	UI.opened=value; UI.frame.Visible=value; UI.input.menu=value
	UIS.MouseBehavior=if value or UI.tracking.vr then Enum.MouseBehavior.Default else Enum.MouseBehavior.LockCenter
	UIS.MouseIconEnabled=value
	if value and UI.panel then
		local head=UI.tracking.head or workspace.CurrentCamera:GetRenderCFrame()
		UI.panel.CFrame=CFrame.new(head.Position)*CFrame.Angles(0,UI.tracking.yaw,0)*CFrame.new(0,0,-4.5)*CFrame.Angles(0,math.pi,0)
	end
	UI.locomotion.reset(); UI.remotes.Action:FireServer({action="Pause",value=value})
end
function UI.notice(text) UI.noticeLabel.Text=text; UI.noticeUntil=os.clock()+4 end
function UI.flash()
	UI.fade.BackgroundTransparency=0
	game:GetService("TweenService"):Create(UI.fade,TweenInfo.new(0.3),{BackgroundTransparency=1}):Play()
	UI.fadeUntil=os.clock()+0.3
end
function UI.vrClick(side)
	if not UI.panel or not UI.opened then return false end
	local cf=if side=="Left" then UI.tracking.left else UI.tracking.right
	local normal=UI.panel.CFrame.LookVector; local denominator=cf.LookVector:Dot(normal)
	if math.abs(denominator)<0.01 then return true end
	local distance=(UI.panel.Position-cf.Position):Dot(normal)/denominator
	if distance<0 or distance>12 then return true end
	local point=UI.panel.CFrame:PointToObjectSpace(cf.Position+cf.LookVector*distance)
	local x=(point.X/UI.panel.Size.X+0.5)*620; local y=(0.5-point.Y/UI.panel.Size.Y)*570
	for button,callback in UI.buttons do
		local p=button.Position; local s=button.Size
		if x>=p.X.Offset and x<=p.X.Offset+s.X.Offset and y>=p.Y.Offset and y<=p.Y.Offset+s.Y.Offset then callback(); break end
	end
	return true
end
function UI.render()
	local s=UI.state; local stage=s:GetAttribute("Stage") or 0; local definition=Definitions[stage]
	local hint=if stage==0 then Definitions.Tutorial[s:GetAttribute("Tutorial") or 1] else definition.Hint
	UI.title.Text="ORBITAL SHIFT   /   "..definition.Title
	UI.objective.Text=hint or ""; UI.hint.Text=UI.target.."   ·   Q/E grab  Z/C use  WASD+R/F hands  J/L turn  TAB menu  H recover"
	local velocity=UI.locomotion.root.AssemblyLinearVelocity.Magnitude
	UI.status.Text=string.format("%s / %.1f m/s\n%s\nL %s  ·  R %s",UI.locomotion.mode:upper(),velocity/3.57,UI.tracking.vr and "VR TRACKING" or "DESKTOP SIMULATION",UI.locomotion.grips.Left and "GRIP" or "FREE",UI.locomotion.grips.Right and "GRIP" or "FREE")
	UI.menuInfo.Text=stage==4 and ("SHIFT COMPLETE / "..tostring(math.floor((s:GetAttribute("Elapsed") or 0)/60)).." MIN\nPower restored · Signal locked · Research secured\nChoose restart or resume for free practice.") or (definition.Title.."\n"..(hint or ""))
	UI.debug.Text=(UI.input.engine or "").." / "..UI.input.profile.."\n"..UI.input.last.."\n"..(UI.input.raw or "Tracking diagnostics ready")
	if os.clock()>(UI.noticeUntil or 0) then UI.noticeLabel.Text="" end
	if UI.wrist then
		UI.wrist.CFrame=UI.tracking.left*CFrame.new(0,0.3,-0.25)*CFrame.Angles(-0.6,math.pi,0)
		UI.wristText.Text=definition.Title.."\n"..(hint or "").."\n"..UI.target
		local head=workspace.CurrentCamera:GetRenderCFrame()
		local aim=if UI.dominant=="Left" then UI.tracking.left else UI.tracking.right
		UI.RayStart.CFrame=aim; UI.RayEnd.CFrame=aim*CFrame.new(0,0,-5); UI.ray.Enabled=UI.opened
		UI.headFade.CFrame=head*CFrame.new(0,0,-0.3); UI.headFade.Transparency=if UI.fadeUntil then math.clamp(1-(UI.fadeUntil-os.clock())/0.3,0,1) else 1
		for i,p in UI.ring do
			local angle=i*math.pi*2/24
			p.CFrame=head*CFrame.new(math.cos(angle)*0.8,math.sin(angle)*0.65,-0.6)*CFrame.Angles(0,0,angle-math.pi/2)
			p.Transparency=if UI.fadeUntil and os.clock()<UI.fadeUntil then 0 else 1-UI.vignette*math.clamp(velocity/5,0,1)
		end
	end
end
return UI
]==])
put([==[StarterPlayer]==],{[==[StarterPlayerScripts]==],[==[OrbitalShiftVR]==]},[==[VRTrackingController]==],[==[ModuleScript]==],[==[local VR=game:GetService("VRService")
local U=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Util)
local T={vr=VR.VREnabled,baseline=Vector3.zero,yaw=0,pitch=0,ready=false,wasTracked=false,handRoll={Left=0,Right=0},
	offsets={Left=Vector3.new(-0.45,-0.55,-2.2),Right=Vector3.new(0.45,-0.55,-2.2)}}
function T.init(root)
	T.root=root
	local camera=workspace.CurrentCamera; camera.HeadScale=1
	if T.vr then
		pcall(function() VR.AutomaticScaling=Enum.VRScaling.Off; VR.AvatarGestures=false; VR.ControllerModels=Enum.VRControllerModelMode.Disabled; VR.LaserPointer=Enum.VRLaserPointerMode.Disabled end)
	end
	T.recenter()
end
function T.recenter()
	if T.vr then
		pcall(function() VR:RecenterUserHeadCFrame() end)
		T.baseline=VR:GetUserCFrame(Enum.UserCFrame.Head).Position*workspace.CurrentCamera.HeadScale
	end
	T.ready=false; T.stable=0; T.wasTracked=false
	if T.onReset then T.onReset() end
end
function T.resetHands()
	T.offsets.Left=Vector3.new(-0.45,-0.55,-2.2); T.offsets.Right=Vector3.new(0.45,-0.55,-2.2)
end
function T.snap(direction)
	local origin=T.origin or CFrame.new(T.root.Position+Vector3.new(0,1.3,0))
	local head=T.head or origin
	T.yaw+=math.rad(30)*direction
	-- Shift the body/origin around the rendered head pivot, preserving physical head position.
	local localHead=origin:PointToObjectSpace(head.Position)
	local rotated=CFrame.Angles(0,math.rad(30)*direction,0):VectorToWorldSpace(head.Position-T.root.Position)
	local candidate=head.Position-rotated
	T.root.CFrame=CFrame.new(candidate)*CFrame.Angles(0,T.yaw,0)
	if T.onReset then T.onReset() end
end
function T.sample(dt,input,grips,paused)
	local scale=workspace.CurrentCamera.HeadScale
	local base=CFrame.new(T.root.Position+Vector3.new(0,1.3,0))*CFrame.Angles(0,T.yaw,0)
	T.origin=base*CFrame.new(-T.baseline)
	local tracked=true
	if T.vr then
		for _,kind in {Enum.UserCFrame.Head,Enum.UserCFrame.LeftHand,Enum.UserCFrame.RightHand} do
			tracked=tracked and VR:GetUserCFrameEnabled(kind)
		end
		if tracked then
			T.head=T.origin*U.scaled(VR:GetUserCFrame(Enum.UserCFrame.Head),scale)
			T.left=T.origin*U.scaled(VR:GetUserCFrame(Enum.UserCFrame.LeftHand),scale)
			T.right=T.origin*U.scaled(VR:GetUserCFrame(Enum.UserCFrame.RightHand),scale)
		end
	else
		T.origin=base*CFrame.Angles(T.pitch,0,0); T.head=T.origin
		local axis=input:handAxis()*dt*2.2
		for _,side in {"Left","Right"} do
			if not paused then
				if grips[side] then
					if input.selected=="Both" or input.selected==side then
						T.offsets[side]=U.clamp(T.offsets[side]+axis,4.4)
						local UIS=game:GetService("UserInputService")
						T.handRoll[side]+=((UIS:IsKeyDown(Enum.KeyCode.T) and 1 or 0)-(UIS:IsKeyDown(Enum.KeyCode.G) and 1 or 0))*dt
					end
				elseif input.extending[side] then T.offsets[side]=Vector3.new(if side=="Left" then -0.35 else 0.35,-0.25,-3.4)
				else T.offsets[side]=T.offsets[side]:Lerp(Vector3.new(if side=="Left" then -0.45 else 0.45,-0.55,-2.2),math.min(1,dt*12)) end
			end
		end
		T.left=T.origin*CFrame.new(T.offsets.Left)*CFrame.Angles(0,0,T.handRoll.Left); T.right=T.origin*CFrame.new(T.offsets.Right)*CFrame.Angles(0,0,T.handRoll.Right)
	end
	if tracked then
		T.stable=(T.stable or 0)+dt; T.ready=T.stable>0.2
	else
		T.stable=0; T.ready=false
	end
	if T.wasTracked and not tracked and T.onReset then T.onReset() end
	if tracked and not T.wasTracked then
		T.stable=0; T.ready=false
		if T.vr then T.baseline=VR:GetUserCFrame(Enum.UserCFrame.Head).Position*scale end
	end
	T.wasTracked=tracked
	T.left=T.left or base*CFrame.new(-0.5,-0.5,-1.5); T.right=T.right or base*CFrame.new(0.5,-0.5,-1.5); T.head=T.head or base
	return T.ready
end
return T
]==])

workspace.Gravity=0
game.Name='Orbital Shift VR'
game:SetAttribute('OrbitalShiftProject',true)
local old=workspace:FindFirstChild('OrbitalShiftVR'); if old then old:Destroy() end
local builder=game.ServerScriptService.OrbitalShiftVR.WorldBuilder:Clone(); builder.Parent=game.ServerScriptService.OrbitalShiftVR
local ok,result=pcall(function() return require(builder).build(workspace:GetAttribute('OSTrainingOnly')==true) end); builder:Destroy(); assert(ok,result)
return 'Orbital Shift VR installed'