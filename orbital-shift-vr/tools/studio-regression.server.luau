-- Controlled Studio integration fixture. Not a substitute for a human VR or desktop playthrough.
-- Insert as a temporary Script under ServerScriptService during Play. Results on State.Regression.
local Run=game:GetService("RunService")
local Http=game:GetService("HttpService")
local f=game.ServerScriptService.OrbitalShiftVR
local R=require(f.PlayerRigService); local G=require(f.GrabService); local I=require(f.InteractionService)
local M=require(f.MissionService); local Recovery=require(f.RecoveryService)
local U=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Util)
local state=game.ReplicatedStorage.OrbitalShiftVR.State
local player=game.Players:GetPlayers()[1]; local s=R.players[player]
assert(s and M.state,"The production server must be running before the fixture")
local results={}; local goal=nil; local clock=0; local seq=s.seq+100
local function check(name,condition,detail)
	table.insert(results,{name=name,passed=not not condition,detail=tostring(detail or "")})
	state:SetAttribute("Regression",Http:JSONEncode(results)); print("[OS TEST] "..(condition and "PASS " or "FAIL ")..name.." "..tostring(detail or ""))
	if not condition then error(name.." / "..tostring(detail)) end
end
local function waitFor(fn,timeout)
	local t=os.clock(); repeat if fn() then return true end; task.wait(.05) until os.clock()-t>(timeout or 6); return false
end
local function locate(position,rotation)
	goal=(rotation or CFrame.identity)+position
	s.root.CFrame=CFrame.new(position+Vector3.new(0,0.8,2.8)); s.root.AssemblyLinearVelocity=Vector3.zero
	s.lastPosition=s.root.Position; s.paused=false; s.tracked=true; s.lastPose=os.clock()
	seq+=1; R.pose(player,{seq=seq,head=s.root.CFrame*CFrame.new(0,1.3,0),left=goal,right=goal*CFrame.new(2,0,1),tracked=true})
end
local driver=Run.Heartbeat:Connect(function(dt)
	if goal then locate(goal.Position,goal.Rotation) end
end)
local function useButton(id)
	local p=I.items[id]; locate(p.Position); task.wait(.15)
	local ok=I.use(player,"Left",p,true,false); I.use(player,"Left",p,false,false); return ok
end
local function carry(id,dockId)
	local p=I.items[id]; local dock=I.items[dockId]
	locate(p.Position,p.CFrame.Rotation); task.wait(.2)
	check("Grab "..id,G.begin(player,"Left",p)); p:SetNetworkOwner(nil)
	local to=dock.Dock.WorldPosition
	local points=if id=="ResearchCase" then {p.Position+Vector3.new(0,2.8,0),Vector3.new(0,8.6,-76),to+Vector3.new(0,2.8,3),to+Vector3.new(0,0,3),to} else {to}
	for _,point in points do
		local from=goal.Position; local duration=math.max(0.6,(point-from).Magnitude/3); local start=os.clock()
		repeat local alpha=math.min(1,(os.clock()-start)/duration); locate(from:Lerp(point,alpha),dock.Dock.WorldCFrame.Rotation); task.wait() until os.clock()-start>=duration
		locate(point,dock.Dock.WorldCFrame.Rotation); task.wait(.35)
	end
	locate(to,dock.Dock.WorldCFrame.Rotation); task.wait(1)
	state:SetAttribute("CarryDiagnostic",Http:JSONEncode({object=tostring(p.Position),goal=tostring(to),target=tostring(G.claims[p] and G.claims[p].target.Position),grip=tostring(s.grips.Left and s.grips.Left.part),force=tostring(p:FindFirstChild("ActiveGrip") and p.ActiveGrip:FindFirstChildOfClass("AlignPosition").MaxForce)}))
	G.release(player,"Left",true)
	check("Dock "..id,dock:GetAttribute("Occupied"),string.format("distance %.3f",(p.Position-to).Magnitude))
end
local function wheel(id,target)
	local p=I.items[id]; locate(p.Position); task.wait(.15)
	check("Grab "..id,G.begin(player,"Left",p))
	local reverse=target<p.Mechanism.CurrentAngle
	check("Use "..id,I.use(player,"Left",p,true,reverse))
	local ok=waitFor(function() locate(p.Position); return math.abs(p.Mechanism.CurrentAngle-target)<1.5 end,10)
	I.use(player,"Left",p,false,false); G.release(player,"Left",true)
	check("Turn "..id,ok,p.Mechanism.CurrentAngle); task.wait(.5)
end
local ok,err=xpcall(function()
	s.root:SetNetworkOwner(nil); for _,h in s.hands do h.part:SetNetworkOwner(nil) end
	check("NaN rejected",not U.finite(0/0)); check("Infinity rejected",not U.finite(math.huge)); check("Bad CFrame rejected",not U.frame("CFrame"))
	check("Unknown object rejected",not G.begin(player,"Left",workspace.Terrain))
	locate(Vector3.new(0,5,7)); check("Distant grip rejected",not G.begin(player,"Left",I.items.CellA))
	local wrong={seq=seq+1,head=CFrame.new(0,0,0),left=CFrame.new(999,0,0),right=CFrame.identity,tracked=true}
	check("Implausible hand rejected",not R.pose(player,wrong))
	local b={}; local accepted=0; for _=1,100 do if U.bucket(b,player,1,5) then accepted+=1 end end
	check("Token bucket bounds burst",accepted==5,accepted)
	check("No mission timer auto-completion",M.stage==0); task.wait(.2); check("Idle still tutorial",M.stage==0)
	check("Physical skip button",useButton("SkipTutorial")); check("Power state",M.stage==1)
	carry("CellA","PowerA"); carry("CellB","PowerB")
	check("Cells alone do not finish power",M.stage==1)
	local lever=I.items.MainLever; locate(lever.Position); task.wait(.15)
	check("Grab main lever",G.begin(player,"Left",lever)); check("Use main lever",I.use(player,"Left",lever,true,false)); G.release(player,"Left",true)
	check("Power transition via actual lever",waitFor(function() return M.stage==2 end),lever.Mechanism.CurrentAngle)
	check("Power doorway physically opens",waitFor(function() return I.items.PowerDoor.Mechanism.CurrentPosition>9 end),I.items.PowerDoor.Mechanism.CurrentPosition)
	check("Duplicate transition rejected",not M.transition(1,2))
	carry("CableEndA","CableSource"); carry("CableEndB","CableReceiver")
	check("Cable alone does not finish signal",M.stage==2)
	wheel("YawWheel",35); wheel("PitchWheel",-20)
	check("Signal actual angles sustained",waitFor(function() return M.stage==3 end),state:GetAttribute("Signal"))
	check("Inner hatch opens",useButton("InnerControl")); check("Inner slide moves",waitFor(function() return I.items.InnerHatch.Mechanism.CurrentPosition>9 end))
	check("Equalize while open rejected",not useButton("Equalize")); task.wait(.7)
	check("Inner closes",useButton("InnerControlInside")); locate(Vector3.new(0,7,-77)); check("Inner physically sealed",waitFor(function() return I.sealed("InnerHatch") end))
	check("Equalize accepted",useButton("Equalize")); check("Vacuum ready",waitFor(function() return state:GetAttribute("Pressure")=="Vacuum" end))
	check("Clip tether",useButton("TetherClip")); check("Real tether constraint",s.tether and s.model:FindFirstChild("SafetyLine")~=nil)
	wheel("OuterWheel",65); check("Exterior hatch opens",waitFor(function() return I.items.OuterHatch.Mechanism.CurrentPosition>9 end))
	carry("ResearchCase","ResearchDock"); check("Case alone does not end mission",M.stage==3)
	wheel("OuterWheel",0); check("Outer physically sealed",waitFor(function() return I.sealed("OuterHatch") end))
	check("Repressurize accepted",useButton("Equalize")); check("Full cycle complete",waitFor(function() return M.stage==4 end),state:GetAttribute("Pressure"))
	check("Session snapshot",M.snapshot().stage==4 and M.snapshot().sockets.ResearchDock=="ResearchCase")
	Recovery.reset(true); goal=nil
	check("Server restart returns tutorial",M.stage==0 and M.tutorial==1)
	check("Restart clears socket contents",not I.items.PowerA:GetAttribute("Occupied") and not I.items.ResearchDock:GetAttribute("Occupied"))
	check("Restart clears grips",next(G.claims)==nil and next(s.grips)==nil)
	state:SetAttribute("RegressionComplete",true)
end,debug.traceback)
driver:Disconnect(); goal=nil
if not ok then state:SetAttribute("RegressionError",err); warn("[OS TEST] "..err) end
s.root:SetNetworkOwner(player); for _,h in s.hands do h.part:SetNetworkOwner(player) end
state:SetAttribute("Regression",Http:JSONEncode(results))
