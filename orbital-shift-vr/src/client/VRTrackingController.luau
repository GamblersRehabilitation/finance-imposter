local VR=game:GetService("VRService")
local U=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Util)
local T={vr=VR.VREnabled,baseline=Vector3.zero,yaw=0,pitch=0,ready=false,wasTracked=false,handRoll={Left=0,Right=0},
	offsets={Left=Vector3.new(-0.45,-0.55,-2.2),Right=Vector3.new(0.45,-0.55,-2.2)}}
function T.init(root)
	T.root=root
	local camera=workspace.CurrentCamera; camera.HeadScale=1
	if T.vr then
		pcall(function() VR.AutomaticScaling=Enum.VRScaling.Off; VR.AvatarGestures=false; VR.ControllerModels=Enum.VRControllerModelMode.Disabled; VR.LaserPointer=Enum.VRLaserPointerMode.Disabled end)
	end
	T.recenter()
end
function T.recenter()
	if T.vr then
		pcall(function() VR:RecenterUserHeadCFrame() end)
		T.baseline=VR:GetUserCFrame(Enum.UserCFrame.Head).Position*workspace.CurrentCamera.HeadScale
	end
	T.ready=false; T.stable=0; T.wasTracked=false
	if T.onReset then T.onReset() end
end
function T.resetHands()
	T.offsets.Left=Vector3.new(-0.45,-0.55,-2.2); T.offsets.Right=Vector3.new(0.45,-0.55,-2.2)
end
function T.snap(direction)
	local origin=T.origin or CFrame.new(T.root.Position+Vector3.new(0,1.3,0))
	local head=T.head or origin
	T.yaw+=math.rad(30)*direction
	-- Shift the body/origin around the rendered head pivot, preserving physical head position.
	local localHead=origin:PointToObjectSpace(head.Position)
	local rotated=CFrame.Angles(0,math.rad(30)*direction,0):VectorToWorldSpace(head.Position-T.root.Position)
	local candidate=head.Position-rotated
	T.root.CFrame=CFrame.new(candidate)*CFrame.Angles(0,T.yaw,0)
	if T.onReset then T.onReset() end
end
function T.sample(dt,input,grips,paused)
	local scale=workspace.CurrentCamera.HeadScale
	local base=CFrame.new(T.root.Position+Vector3.new(0,1.3,0))*CFrame.Angles(0,T.yaw,0)
	T.origin=base*CFrame.new(-T.baseline)
	local tracked=true
	if T.vr then
		for _,kind in {Enum.UserCFrame.Head,Enum.UserCFrame.LeftHand,Enum.UserCFrame.RightHand} do
			tracked=tracked and VR:GetUserCFrameEnabled(kind)
		end
		if tracked then
			T.head=T.origin*U.scaled(VR:GetUserCFrame(Enum.UserCFrame.Head),scale)
			T.left=T.origin*U.scaled(VR:GetUserCFrame(Enum.UserCFrame.LeftHand),scale)
			T.right=T.origin*U.scaled(VR:GetUserCFrame(Enum.UserCFrame.RightHand),scale)
		end
	else
		T.origin=base*CFrame.Angles(T.pitch,0,0); T.head=T.origin
		local axis=input:handAxis()*dt*2.2
		for _,side in {"Left","Right"} do
			if not paused then
				if grips[side] then
					if input.selected=="Both" or input.selected==side then
						T.offsets[side]=U.clamp(T.offsets[side]+axis,4.4)
						local UIS=game:GetService("UserInputService")
						T.handRoll[side]+=((UIS:IsKeyDown(Enum.KeyCode.T) and 1 or 0)-(UIS:IsKeyDown(Enum.KeyCode.G) and 1 or 0))*dt
					end
				elseif input.extending[side] then T.offsets[side]=Vector3.new(if side=="Left" then -0.35 else 0.35,-0.25,-3.4)
				else T.offsets[side]=T.offsets[side]:Lerp(Vector3.new(if side=="Left" then -0.45 else 0.45,-0.55,-2.2),math.min(1,dt*12)) end
			end
		end
		T.left=T.origin*CFrame.new(T.offsets.Left)*CFrame.Angles(0,0,T.handRoll.Left); T.right=T.origin*CFrame.new(T.offsets.Right)*CFrame.Angles(0,0,T.handRoll.Right)
	end
	if tracked then
		T.stable=(T.stable or 0)+dt; T.ready=T.stable>0.2
	else
		T.stable=0; T.ready=false
	end
	if T.wasTracked and not tracked and T.onReset then T.onReset() end
	if tracked and not T.wasTracked then
		T.stable=0; T.ready=false
		if T.vr then T.baseline=VR:GetUserCFrame(Enum.UserCFrame.Head).Position*scale end
	end
	T.wasTracked=tracked
	T.left=T.left or base*CFrame.new(-0.5,-0.5,-1.5); T.right=T.right or base*CFrame.new(0.5,-0.5,-1.5); T.head=T.head or base
	return T.ready
end
return T
