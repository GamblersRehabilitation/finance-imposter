local UIS=game:GetService("UserInputService")
local Config=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Config)
local I={states={},extending={},stick=Vector2.zero,turnNeutral=true,last="No input yet",profile="Quest",sensitivity=1,selected="Both"}
function I:emit(name,value)
	self.states[name]=value; self.last=name.." / "..tostring(value)
	if self.callback then self.callback(name,value) end
end
function I:bind(profile)
	self.profile=profile or self.profile
	if self.context then self.context:Destroy() end
	local bindings=Config.Profiles[self.profile]
	local desktop={GrabLeft="Q",GrabRight="E",UseLeft="Z",UseRight="C",Menu="Tab",Recover="H",Push="Space",SnapLeft="J",SnapRight="L",SelectHand="V"}
	local ok,context=pcall(Instance.new,"InputContext")
	if ok then
		self.engine="Input Action System"; self.context=context; context.Name="OrbitalShiftActions"; context.Priority=300; context.Sink=true; context.Parent=game.Players.LocalPlayer.PlayerGui
		for name,key in desktop do
			local a=Instance.new("InputAction"); a.Name=name; a.Type=Enum.InputActionType.Bool; a.Parent=context
			local b=Instance.new("InputBinding"); b.Name="Keyboard"; b.KeyCode=Enum.KeyCode[key]; b.Parent=a
			if bindings[name] then local controller=Instance.new("InputBinding"); controller.Name="Controller"; controller.KeyCode=Enum.KeyCode[bindings[name]]; controller.Parent=a end
			a.StateChanged:Connect(function(value) self:emit(name,value) end)
		end
		context.Enabled=true
	else
		self.engine="ContextActionService compatibility adapter"
		local CAS=game:GetService("ContextActionService")
		for name,key in desktop do
			local keys={Enum.KeyCode[key]}; if bindings[name] then table.insert(keys,Enum.KeyCode[bindings[name]]) end
			CAS:BindActionAtPriority("OS"..name,function(_,state)
				if state==Enum.UserInputState.Begin then self:emit(name,true) elseif state==Enum.UserInputState.End or state==Enum.UserInputState.Cancel then self:emit(name,false) end
				return Enum.ContextActionResult.Sink
			end,false,300,table.unpack(keys))
		end
	end
end
function I.init(callback,tracking)
	I.callback=callback; I.tracking=tracking; I:bind("Quest")
	UIS.InputChanged:Connect(function(input,processed)
		if input.KeyCode==Enum.KeyCode.Thumbstick2 then
			local x=input.Position.X
			if math.abs(x)<0.25 then I.turnNeutral=true
			elseif math.abs(x)>0.7 and I.turnNeutral then I.turnNeutral=false; I:emit(if x>0 then "SnapRight" else "SnapLeft",true) end
		elseif input.KeyCode==Enum.KeyCode.Thumbstick1 then I.stick=Vector2.new(input.Position.X,input.Position.Y)
		elseif input.UserInputType==Enum.UserInputType.MouseMovement and not tracking.vr and not I.menu then
			tracking.yaw-=input.Delta.X*0.003*I.sensitivity
			tracking.pitch=math.clamp(tracking.pitch-input.Delta.Y*0.003*I.sensitivity,-1.2,1.2)
		end
		I.raw=input.KeyCode.Name.." "..tostring(input.Position)
	end)
	UIS.WindowFocusReleased:Connect(function() if I.onFocusLost then I.onFocusLost() end end)
end
function I:handAxis()
	if UIS:GetFocusedTextBox() then return Vector3.zero end
	local function k(code) return if UIS:IsKeyDown(code) then 1 else 0 end
	return Vector3.new(k(Enum.KeyCode.A)-k(Enum.KeyCode.D),k(Enum.KeyCode.R)-k(Enum.KeyCode.F),k(Enum.KeyCode.W)-k(Enum.KeyCode.S))
end
function I:reverse() return UIS:IsKeyDown(Enum.KeyCode.LeftShift) or self.stick.Y< -0.4 end
return I
