local Players=game:GetService("Players")
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
