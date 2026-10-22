-- Temporary Studio-only test. Invoked by StudioTestService with 1 initial client.
local STS=game:GetService("StudioTestService")
if STS:GetTestArgs()~="OS_MULTIPLAYER" then return end
local Players=game:GetService("Players")
local Http=game:GetService("HttpService")
local namespace=game.ReplicatedStorage:WaitForChild("OrbitalShiftVR")
local state=namespace:WaitForChild("State")
local f=game.ServerScriptService.OrbitalShiftVR
local R=require(f.PlayerRigService); local G=require(f.GrabService); local M=require(f.MissionService); local I=require(f.InteractionService)
local harness=Instance.new("RemoteEvent"); harness.Name="NetworkFixture"; harness.Parent=namespace.Remotes
local reports,ready,results={},{},{}
harness.OnServerEvent:Connect(function(player,kind,stage,practice)
	if kind=="Ready" then ready[player]=true elseif kind=="Snapshot" then reports[player]={stage=stage,practice=practice} end
end)
local function waitFor(fn,seconds)
	local start=os.clock(); repeat if fn() then return true end; task.wait(.05) until os.clock()-start>(seconds or 8); return false
end
local function check(name,condition,detail)
	table.insert(results,{name=name,passed=not not condition,detail=tostring(detail or "")})
	print("[OS NETWORK] "..(condition and "PASS " or "FAIL ")..name)
	assert(condition,name.." / "..tostring(detail))
end
task.delay(55,function() pcall(function() STS:EndTest({passed=false,error="Network fixture timeout",results=results}) end) end)
local ok,err=xpcall(function()
	check("First client ready",waitFor(function() return #Players:GetPlayers()==1 and ready[Players:GetPlayers()[1]] end))
	local a=Players:GetPlayers()[1]; local s=R.players[a]
	local practice=I.items.PracticeCell; s.root.CFrame=CFrame.new(3.2,6,3); s.lastPosition=s.root.Position
	practice.CFrame=I.items.PracticeDock.Dock.WorldCFrame; practice.AssemblyLinearVelocity=Vector3.zero
	check("Valid fixture socket",I.dock(a,practice)); check("Fixture progress",M.transition(0,1))
	STS:AddPlayers(1)
	check("Second client late joins",waitFor(function() return #Players:GetPlayers()==2 and ready[Players:GetPlayers()[2]] end))
	local b=Players:GetPlayers()[2]
	harness:FireAllClients("Snapshot")
	check("Both snapshot current progress",waitFor(function() return reports[a] and reports[b] and reports[a].stage==1 and reports[b].stage==1 end))
	check("Both snapshot socket contents",reports[a].practice=="PracticeCell" and reports[b].practice=="PracticeCell")
	local cell=I.items.CellA
	for index,player in {a,b} do
		local rig=R.players[player]; rig.paused=false
		rig.root.CFrame=CFrame.new(cell.Position+Vector3.new(if index==1 then -1 else 1,1,2.8)); rig.lastPosition=rig.root.Position
		harness:FireClient(player,"Prepare",cell.CFrame)
	end
	task.wait(.8); harness:FireAllClients("Grab",cell)
	check("Simultaneous grip chooses one owner",waitFor(function() return G.claims[cell]~=nil end))
	task.wait(.6); local owner=G.claims[cell].player; local other=if owner==a then b else a
	local one=0; for _,rig in R.players do if rig.grips.Left and rig.grips.Left.part==cell then one+=1 end end
	check("No conflicting object authority",one==1 and cell:GetAttribute("HeldBy")==owner.UserId,one)
	harness:FireClient(owner,"Release")
	check("Release clears ownership claim",waitFor(function() return G.claims[cell]==nil end))
	harness:FireClient(other,"Grab",cell)
	check("Other client receives handoff",waitFor(function() return G.claims[cell] and G.claims[cell].player==other end))
	local previous=state:GetAttribute("RejectedRequests") or 0
	harness:FireAllClients("Malformed")
	check("Bad remote actions rejected",waitFor(function() return (state:GetAttribute("RejectedRequests") or 0)>=previous+4 end))
	harness:FireClient(other,"Leave")
	check("Client disconnect completes",waitFor(function() return #Players:GetPlayers()==1 end))
	check("Disconnect clears grip",waitFor(function() return G.claims[cell]==nil and cell:GetAttribute("HeldBy")==nil end))
	check("Important item remains recoverable",cell.Parent~=nil and not cell.Anchored)
end,debug.traceback)
STS:EndTest({passed=ok,error=if ok then nil else err,results=results})
