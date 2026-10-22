local Tween=game:GetService("TweenService")
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
