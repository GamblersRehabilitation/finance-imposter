local Config=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Config)
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
