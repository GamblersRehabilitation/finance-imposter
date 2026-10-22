local Players=game:GetService("Players")
local Physics=game:GetService("PhysicsService")
local Config=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Config)
local U=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Util)
local R={players={}}
local function p(parent,name,size,cf,anchored)
	local v=Instance.new("Part"); v.Name=name; v.Size=size; v.CFrame=cf; v.Anchored=anchored or false
	v.CanCollide=false; v.CanTouch=false; v.Transparency=1; v.Parent=parent; return v
end
function R.init()
	Players.CharacterAutoLoads=false
	for _,name in {"OSBody","OSHand","OSObject","OSMechanism"} do pcall(function() Physics:RegisterCollisionGroup(name) end) end
	Physics:CollisionGroupSetCollidable("OSMechanism","Default",false)
	Physics:CollisionGroupSetCollidable("OSBody","OSHand",false)
	Physics:CollisionGroupSetCollidable("OSHand","OSHand",false)
	Physics:CollisionGroupSetCollidable("OSBody","OSBody",false)
	for _,v in workspace.OrbitalShiftVR.Interactables:GetChildren() do
		if v:IsA("BasePart") and v:GetAttribute("Kind")=="Loose" then v.CollisionGroup="OSObject"; v:SetNetworkOwner(nil) end
		if v:IsA("BasePart") and (v:GetAttribute("Kind")=="Door" or v:GetAttribute("Kind")=="Lever" or v:GetAttribute("Kind")=="Wheel") then v.CollisionGroup="OSMechanism"; v:SetNetworkOwner(nil) end
	end
end
function R.spawn(player,cf)
	if R.players[player] then R.remove(player) end
	local model=Instance.new("Model"); model.Name="Crew_"..player.UserId; model:SetAttribute("Owner",player.UserId); model.Parent=workspace.OrbitalShiftVR.Rigs
	local root=p(model,"HumanoidRootPart",Vector3.one*(Config.Physics.BodyRadius*2),cf)
	root.Shape=Enum.PartType.Ball; root.CanCollide=true; root.CollisionGroup="OSBody"
	root.CustomPhysicalProperties=PhysicalProperties.new(3,0.25,0,1,1); model.PrimaryPart=root
	local head=p(model,"Head",Vector3.one*0.5,cf*CFrame.new(0,1.3,0)); head.Massless=true
	local weld=Instance.new("WeldConstraint"); weld.Part0=root; weld.Part1=head; weld.Parent=head
	local humanoid=Instance.new("Humanoid"); humanoid.RequiresNeck=false; humanoid.BreakJointsOnDeath=false
	humanoid.AutoRotate=false; humanoid.WalkSpeed=0; humanoid.JumpPower=0; humanoid.PlatformStand=true; humanoid.DisplayDistanceType=Enum.HumanoidDisplayDistanceType.None
	humanoid.Parent=model; humanoid:ChangeState(Enum.HumanoidStateType.Physics)
	local a=Instance.new("Attachment"); a.Name="BodyAttachment"; a.Parent=root
	local upright=Instance.new("AlignOrientation"); upright.Name="StableHorizon"; upright.Mode=Enum.OrientationAlignmentMode.OneAttachment
	upright.Attachment0=a; upright.CFrame=CFrame.identity; upright.MaxTorque=8000; upright.MaxAngularVelocity=8; upright.Responsiveness=50; upright.RigidityEnabled=false; upright.Parent=root
	local force=Instance.new("VectorForce"); force.Name="HandLocomotion"; force.Attachment0=a; force.RelativeTo=Enum.ActuatorRelativeTo.World; force.ApplyAtCenterOfMass=true; force.Parent=root
	local hands={}
	for _,side in {"Left","Right"} do
		local hand=p(model,side.."Hand",Vector3.one*0.48,cf*CFrame.new(if side=="Left" then -0.6 else 0.6,0.7,-1.5))
		hand.Shape=Enum.PartType.Ball; hand.CanCollide=true; hand.Transparency=0; hand.Color=if side=="Left" then Color3.fromRGB(88,221,223) else Color3.fromRGB(246,126,49)
		hand.CollisionGroup="OSHand"; hand.CustomPhysicalProperties=PhysicalProperties.new(0.5,0.6,0,1,1)
		local target=p(model,side.."Target",Vector3.one*0.1,hand.CFrame,true)
		local h=Instance.new("Attachment"); h.Name="HandAttachment"; h.Parent=hand
		local t=Instance.new("Attachment"); t.Parent=target
		local pos=Instance.new("AlignPosition"); pos.Mode=Enum.PositionAlignmentMode.TwoAttachment; pos.Attachment0=h; pos.Attachment1=t
		pos.MaxForce=Config.Physics.HandForce; pos.MaxVelocity=Config.Physics.HandSpeed; pos.Responsiveness=40
		pos.ReactionForceEnabled=false; pos.RigidityEnabled=false; pos.ApplyAtCenterOfMass=true; pos.Parent=hand
		local rot=Instance.new("AlignOrientation"); rot.Mode=Enum.OrientationAlignmentMode.TwoAttachment; rot.Attachment0=h; rot.Attachment1=t
		rot.MaxTorque=200; rot.MaxAngularVelocity=12; rot.Responsiveness=35; rot.ReactionTorqueEnabled=false; rot.RigidityEnabled=false; rot.Parent=hand
		hands[side]={part=hand,target=target,attachment=h,pose=hand.CFrame}
	end
	player.Character=model; root:SetNetworkOwner(player)
	for _,hand in hands do hand.part:SetNetworkOwner(player) end
	local state={player=player,model=model,root=root,hands=hands,grips={},seq=-1,lastPose=0,lastPosition=cf.Position,
		mode="Assisted",paused=false,tether=false,uses={},samples={Left={},Right={}},lastValid=cf,spawned=os.clock()}
	R.players[player]=state; player:SetAttribute("OSReady",true)
	return state
end
function R.remove(player)
	local s=R.players[player]; if not s then return end
	if R.onRemove then R.onRemove(player) end
	if s.tetherAnchor then s.tetherAnchor:Destroy() end
	s.model:Destroy(); R.players[player]=nil
end
function R.pose(player,data)
	local s=R.players[player]
	if not s or type(data)~="table" or not U.finite(data.seq) or data.seq%1~=0 or data.seq<=s.seq or data.seq>2^31 then return false end
	if type(data.tracked)~="boolean" or not U.frame(data.left) or not U.frame(data.right) or not U.frame(data.head) then return false end
	for _,cf in {data.left,data.right,data.head} do if (cf.Position-s.root.Position).Magnitude>Config.Physics.Reach+1.5 then return false end end
	s.seq=data.seq; s.lastPose=os.clock(); s.tracked=data.tracked
	if not data.tracked then if R.onTrackingLost then R.onTrackingLost(player) end; return true end
	for side,key in {Left="left",Right="right"} do
		local hand=s.hands[side]; local cf=data[key]
		local ray=RaycastParams.new(); ray.FilterType=Enum.RaycastFilterType.Exclude; ray.FilterDescendantsInstances={s.model}; ray.RespectCanCollide=true
		local dir=cf.Position-s.root.Position
		local hit=workspace:Raycast(s.root.Position,dir,ray)
		if hit and hit.Distance<dir.Magnitude-0.5 and hit.Instance:GetAttribute("Kind")~="Loose" then
			cf=cf.Rotation+hit.Position+hit.Normal*0.3
		end
		hand.pose=cf; hand.target.CFrame=cf
		local history=s.samples[side]; table.insert(history,{t=os.clock(),cf=cf})
		while #history>2 and history[1].t<os.clock()-0.13 do table.remove(history,1) end
	end
	s.head=data.head; return true
end
return R
