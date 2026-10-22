local Config=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Config)
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
