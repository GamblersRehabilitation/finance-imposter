local Config=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Config)
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
