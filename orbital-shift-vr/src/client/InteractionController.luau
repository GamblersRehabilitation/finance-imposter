local Collection=game:GetService("CollectionService")
local Haptic=game:GetService("HapticService")
local U=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Util)
local I={candidates={},highlights={},pending={},using={},desired={}}
function I.init(tracking,locomotion,remotes,ui)
	I.tracking=tracking; I.locomotion=locomotion; I.remotes=remotes; I.ui=ui
	I.parts={}; for _,p in Collection:GetTagged("OSInteractable") do if p:IsDescendantOf(workspace.OrbitalShiftVR) then table.insert(I.parts,p) end end
	Collection:GetInstanceAddedSignal("OSInteractable"):Connect(function(p) if p:IsDescendantOf(workspace.OrbitalShiftVR) then table.insert(I.parts,p) end end)
	for _,side in {"Left","Right"} do
		local h=Instance.new("Highlight"); h.Name=side.."Focus"; h.FillTransparency=0.88; h.OutlineColor=if side=="Left" then Color3.fromRGB(88,221,223) else Color3.fromRGB(246,126,49)
		h.DepthMode=Enum.HighlightDepthMode.Occluded; h.Parent=game.Players.LocalPlayer.PlayerGui; I.highlights[side]=h
	end
end
function I.pulse(side)
	local motor=if side=="Left" then Enum.VibrationMotor.LeftHand else Enum.VibrationMotor.RightHand
	pcall(function()
		if Haptic:IsVibrationSupported(Enum.UserInputType.Gamepad1) and Haptic:IsMotorSupported(Enum.UserInputType.Gamepad1,motor) then
			Haptic:SetMotor(Enum.UserInputType.Gamepad1,motor,0.18); task.delay(0.055,function() Haptic:SetMotor(Enum.UserInputType.Gamepad1,motor,0) end)
		end
	end)
end
function I.scan()
	for _,side in {"Left","Right"} do
		local cf=if side=="Left" then I.tracking.left else I.tracking.right
		local nearest=nil; local distance=0.95
		for _,p in I.parts do
			if not p.Parent or p:GetAttribute("Docked") then continue end
			local d=(U.surface(p,cf.Position)-cf.Position).Magnitude
			if d<distance then distance=d; nearest=p end
		end
		I.candidates[side]=nearest; I.highlights[side].Adornee=nearest; I.highlights[side].Enabled=nearest~=nil
	end
	local candidate=I.candidates.Right or I.candidates.Left
	if I.ui then I.ui.target=candidate and ((candidate:GetAttribute("Label") or candidate.Name).."  /  "..(candidate:GetAttribute("Kind") or "")) or "Find an orange handrail" end
end
function I.grab(side,down)
	I.desired[side]=down
	if down then
		local p=I.candidates[side]; if p then I.pending[side]=p; I.remotes.Action:FireServer({action="Grab",side=side,part=p}) end
	else
		I.remotes.Action:FireServer({action="Release",side=side}); I.locomotion.grips[side]=nil; I.pending[side]=nil
		if not I.tracking.vr then I.tracking.resetHands() end
	end
end
function I.use(side,down,reverse)
	local g=I.locomotion.grips[side]
	local p=if down then (g and g.part or I.candidates[side]) else I.using[side]
	if p or not down then I.remotes.Action:FireServer({action="Use",side=side,part=p,down=down,reverse=reverse}) end
	I.using[side]=if down then p else nil
end
function I.feedback(data)
	if data.type=="Grip" then
		if not I.desired[data.side] then I.remotes.Action:FireServer({action="Release",side=data.side}); return end
		I.locomotion.grips[data.side]={part=data.part,kind=data.kind,anchor=data.anchor,offset=data.offset}; I.pending[data.side]=nil; I.pulse(data.side)
	elseif data.type=="Release" then I.locomotion.grips[data.side]=nil; I.pending[data.side]=nil end
end
return I
