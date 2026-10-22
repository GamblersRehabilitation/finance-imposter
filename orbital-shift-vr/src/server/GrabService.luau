local Collection=game:GetService("CollectionService")
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
