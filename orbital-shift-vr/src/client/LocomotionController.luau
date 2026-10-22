local Config=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Config)
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
