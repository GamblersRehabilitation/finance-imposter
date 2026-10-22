-- Temporary Studio-only network fixture; excluded from the shipped place.
local player=game.Players.LocalPlayer
local namespace=game.ReplicatedStorage:WaitForChild("OrbitalShiftVR")
local remotes=namespace:WaitForChild("Remotes")
local harness=remotes:WaitForChild("NetworkFixture",30)
if not harness then return end
repeat task.wait(.1) until player.PlayerGui:FindFirstChild("OrbitalShiftMenu")
local f=player.PlayerScripts.OrbitalShiftVR
local ui=require(f.UIController); ui.open(false); ui.open=function() end
game:GetService("RunService"):UnbindFromRenderStep("OrbitalShiftTracking")
require(f.LocomotionController).step=function() end; require(f.VRTrackingController).onReset=nil
setmetatable(require(f.InteractionController).desired,{__index=function() return true end})
local seq=1000; local target=nil
task.spawn(function()
	while player.Parent do
		if target and player.Character then
			seq+=1; local root=player.Character.PrimaryPart
			remotes.Pose:FireServer({seq=seq,head=root.CFrame*CFrame.new(0,1.3,0),left=target,right=target*CFrame.new(2,0,0),tracked=true})
		end
		task.wait(.04)
	end
end)
remotes.Feedback.OnClientEvent:Connect(function(data)
	if data.type=="Snapshot" then harness:FireServer("Snapshot",data.stage,data.sockets.PracticeDock) end
end)
harness.OnClientEvent:Connect(function(command,data)
	if command=="Prepare" then target=data
	elseif command=="Snapshot" then remotes.Action:FireServer({action="Snapshot"})
	elseif command=="Grab" then remotes.Action:FireServer({action="Grab",side="Left",part=data})
	elseif command=="Release" then remotes.Action:FireServer({action="Release",side="Left"})
	elseif command=="Malformed" then
		remotes.Action:FireServer({action="MissionComplete"}); remotes.Action:FireServer({action="Grab",side="Invalid",part=workspace.Terrain})
		remotes.Pose:FireServer({seq=seq-50,head=CFrame.identity,left=CFrame.identity,right=CFrame.identity,tracked=true})
	elseif command=="Leave" then local service=game:GetService("StudioTestService"); if service:CanLeaveTest() then service:LeaveTest() end
	end
end)
player:SetAttribute("NetworkFixtureReady",true)
harness:FireServer("Ready")
