local Players=game:GetService("Players")
local Run=game:GetService("RunService")
local UIS=game:GetService("UserInputService")
local player=Players.LocalPlayer
local namespace=game.ReplicatedStorage:WaitForChild("OrbitalShiftVR")
local Config=require(namespace.Shared.Config)
local tracking=require(script.Parent.VRTrackingController)
local camera=require(script.Parent.CameraController)
local locomotion=require(script.Parent.LocomotionController)
local hands=require(script.Parent.HandController)
local interactions=require(script.Parent.InteractionController)
local input=require(script.Parent.InputAdapter)
local ui=require(script.Parent.UIController)
local avatars=require(script.Parent.RemoteAvatarController)
local remotes=namespace:WaitForChild("Remotes")
local model=player.Character or player.CharacterAdded:Wait()
local root=model:WaitForChild("HumanoidRootPart")
local function disableDefault(module)
	if module.Name=="PlayerModule" and module:IsA("ModuleScript") then pcall(function() require(module):GetControls():Disable() end) end
end
local defaultModule=player.PlayerScripts:FindFirstChild("PlayerModule"); if defaultModule then disableDefault(defaultModule) end
player.PlayerScripts.ChildAdded:Connect(disableDefault)
tracking.init(root); camera.init(tracking); locomotion.init(root,tracking,model)
local function clear()
	locomotion.reset(); remotes.Action:FireServer({action="Recenter"}); tracking.resetHands()
	if interactions.desired then table.clear(interactions.desired) end
end
tracking.onReset=clear; locomotion.onOverlap=clear
local toggled={}
input.init(function(action,value)
	if action=="Menu" and value then ui.open(not ui.opened); return end
	if action=="Recover" and value then remotes.Action:FireServer({action="Recover"}); return end
	if action=="UseLeft" or action=="UseRight" then
		local side=if action=="UseLeft" then "Left" else "Right"
		if value and ui.vrClick(side) then return end
		if ui.opened then return end
		interactions.use(side,value,input:reverse()); return
	end
	if ui.opened then return end
	if action=="SelectHand" and value then
		input.selected=if input.selected=="Both" then "Left" elseif input.selected=="Left" then "Right" else "Both"; ui.notice("HAND CONTROL / "..input.selected:upper())
	elseif action=="GrabLeft" or action=="GrabRight" then
		local side=if action=="GrabLeft" then "Left" else "Right"
		if ui.toggleGrab then if not value then return end; toggled[side]=not toggled[side]; value=toggled[side] end
		input.extending[side]=value
		-- Desktop can extend each hand independently before acquisition.
		if value and not interactions.candidates[side] and not tracking.vr then
			tracking.offsets[side]=Vector3.new(if side=="Left" then -0.35 else 0.35,-0.25,-3.4)
			tracking.sample(0,input,locomotion.grips,false); interactions.scan()
		end
		interactions.grab(side,value)
	elseif action=="SnapLeft" and value then clear(); tracking.snap(1)
	elseif action=="SnapRight" and value then clear(); tracking.snap(-1)
	elseif action=="Push" and value then
		local side=if interactions.candidates[ui.dominant] then ui.dominant else (if ui.dominant=="Right" then "Left" else "Right")
		local part=interactions.candidates[side]; if part then remotes.Action:FireServer({action="Push",side=side,part=part}) end
	end
end,tracking)
ui.init(tracking,input,locomotion,remotes)
interactions.init(tracking,locomotion,remotes,ui); hands.init(model,tracking,locomotion.grips); avatars.init(remotes.Pose)
input.onFocusLost=function() ui.open(true) end
remotes.Feedback.OnClientEvent:Connect(function(data)
	if type(data)~="table" then return end
	interactions.feedback(data)
	if data.type=="Notice" then ui.notice(data.text)
	elseif data.type=="Recover" then
		locomotion.reset(); tracking.yaw=0; tracking.pitch=0; tracking.recenter(); ui.flash()
		locomotion.lastSafe=data.cf
	end
end)
local lastStage=namespace.State:GetAttribute("Stage") or 0
namespace.State:GetAttributeChangedSignal("Stage"):Connect(function()
	local stage=namespace.State:GetAttribute("Stage"); if stage==4 and lastStage~=4 then ui.open(true) end; lastStage=stage
end)
local sendTime,scanTime,seq=0,0,0
Run:BindToRenderStep("OrbitalShiftTracking",Enum.RenderPriority.Camera.Value+1,function(dt)
	tracking.sample(dt,input,locomotion.grips,ui.opened); camera.render(); hands.render(dt); avatars.render(dt); ui.render()
	sendTime+=dt; scanTime+=dt
	if scanTime>=0.075 then interactions.scan(); scanTime=0 end
	if sendTime>=1/Config.Physics.PoseHz then
		sendTime=0; seq+=1
		remotes.Pose:FireServer({seq=seq,head=tracking.head,left=tracking.left,right=tracking.right,tracked=tracking.ready})
	end
end)
Run.PreSimulation:Connect(function(dt) locomotion.step(dt,ui.opened) end)
remotes.Action:FireServer({action="Snapshot"})
print("[OrbitalShiftVR] Client ready / "..(tracking.vr and "VR" or "Desktop").." / "..input.engine)
