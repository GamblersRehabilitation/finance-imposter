local Players=game:GetService("Players")
local UIS=game:GetService("UserInputService")
local Definitions=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Missions)
local UI={opened=false,target="",vignette=0.4,dominant="Right",seated=false,toggleGrab=false,buttons={},ring={}}
local palette={bg=Color3.fromRGB(18,32,47),ink=Color3.fromRGB(230,229,213),orange=Color3.fromRGB(246,126,49),cyan=Color3.fromRGB(88,221,223)}
local function label(parent,name,text,pos,size,fontSize,color)
	local t=Instance.new("TextLabel"); t.Name=name; t.Text=text; t.Position=pos; t.Size=size; t.TextSize=fontSize; t.BackgroundTransparency=1
	t.TextColor3=color or palette.ink; t.TextXAlignment=Enum.TextXAlignment.Left; t.TextYAlignment=Enum.TextYAlignment.Top; t.Font=Enum.Font.GothamMedium; t.TextWrapped=true; t.Parent=parent; return t
end
function UI.init(tracking,input,locomotion,remotes)
	UI.tracking=tracking; UI.input=input; UI.locomotion=locomotion; UI.remotes=remotes
	UI.state=game.ReplicatedStorage.OrbitalShiftVR:WaitForChild("State")
	local gui=Instance.new("ScreenGui"); gui.Name="OrbitalShiftHUD"; gui.IgnoreGuiInset=false; gui.ResetOnSpawn=false; gui.Parent=Players.LocalPlayer.PlayerGui; UI.gui=gui
	UI.title=label(gui,"Mission","ORBITAL SHIFT",UDim2.fromOffset(26,22),UDim2.new(0.7,0,0,28),20,palette.orange)
	UI.objective=label(gui,"Objective","",UDim2.new(0,26,1,-130),UDim2.new(0.7,0,0,78),17)
	UI.hint=label(gui,"Controls","",UDim2.new(0,26,1,-36),UDim2.new(1,-52,0,26),13,palette.cyan)
	UI.status=label(gui,"Flight","",UDim2.new(1,-250,0,25),UDim2.fromOffset(225,100),13,palette.cyan)
	UI.noticeLabel=label(gui,"Notice","",UDim2.new(0.2,0,0.2,0),UDim2.fromScale(0.6,0.15),23,palette.orange); UI.noticeLabel.TextXAlignment=Enum.TextXAlignment.Center
	local dot=Instance.new("Frame"); dot.Name="Aim"; dot.Size=UDim2.fromOffset(4,4); dot.Position=UDim2.fromScale(0.5,0.5); dot.BackgroundColor3=palette.ink; dot.BorderSizePixel=0; dot.Parent=gui
	local fade=Instance.new("Frame"); fade.Name="Fade"; fade.BackgroundColor3=Color3.new(); fade.BackgroundTransparency=1; fade.Size=UDim2.fromScale(1,1); fade.ZIndex=50; fade.Parent=gui; UI.fade=fade
	local menuGui=Instance.new("ScreenGui"); menuGui.Name="OrbitalShiftMenu"; menuGui.ResetOnSpawn=false; menuGui.DisplayOrder=10; menuGui.Parent=Players.LocalPlayer.PlayerGui; UI.menuGui=menuGui
	local frame=Instance.new("Frame"); frame.Name="ComfortMenu"; frame.Size=UDim2.fromOffset(620,570); frame.AnchorPoint=Vector2.new(0.5,0.5); frame.Position=UDim2.fromScale(0.5,0.5); frame.BackgroundColor3=palette.bg; frame.BorderSizePixel=0; frame.Parent=menuGui; UI.frame=frame
	local stroke=Instance.new("UIStroke"); stroke.Color=palette.orange; stroke.Thickness=2; stroke.Parent=frame
	if not tracking.vr then
		local scale=Instance.new("UIScale"); scale.Parent=frame
		local function fit() local size=workspace.CurrentCamera.ViewportSize; scale.Scale=math.min(1,(size.X-28)/620,(size.Y-70)/570) end
		fit(); workspace.CurrentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(fit)
	end
	label(frame,"Brand","ORBITAL SHIFT / CREW CONSOLE",UDim2.fromOffset(24,18),UDim2.fromOffset(570,30),22,palette.orange)
	label(frame,"Subtitle","A station in pieces. Two hands to put it back together.",UDim2.fromOffset(24,54),UDim2.fromOffset(570,34),14)
	UI.menuInfo=label(frame,"Info","",UDim2.fromOffset(24,94),UDim2.fromOffset(570,83),14,palette.cyan)
	local y=190
	local function button(text,x,w,callback)
		local b=Instance.new("TextButton"); b.Name=text:gsub("[^%w]",""); b.Text=text; b.Size=UDim2.fromOffset(w,34); b.Position=UDim2.fromOffset(x,y)
		b.BackgroundColor3=Color3.fromRGB(38,57,74); b.BorderSizePixel=0; b.TextColor3=palette.ink; b.Font=Enum.Font.GothamMedium; b.TextSize=14; b.Parent=frame
		b.Activated:Connect(callback); UI.buttons[b]=callback; return b
	end
	button("START / RESUME",24,278,function() UI.open(false) end)
	button("RECOVER TO CHECKPOINT",316,280,function() remotes.Action:FireServer({action="Recover"}); UI.open(false) end); y+=44
	local mode; mode=button("MODE / ASSISTED",24,278,function() locomotion.mode=if locomotion.mode=="Assisted" then "Inertial" else "Assisted"; mode.Text="MODE / "..locomotion.mode:upper(); remotes.Action:FireServer({action="Mode",value=locomotion.mode}) end)
	local speed; speed=button("SPEED / 100%",316,280,function() locomotion.speed=if locomotion.speed==1 then 0.6 elseif locomotion.speed==0.6 then 0.8 else 1; speed.Text="SPEED / "..math.floor(locomotion.speed*100).."%" end); y+=44
	local profile; profile=button("PROFILE / QUEST",24,278,function() local nextProfile=if input.profile=="Quest" then "Pico / SteamVR" elseif input.profile=="Pico / SteamVR" then "Swapped grips/triggers" else "Quest"; input:bind(nextProfile); profile.Text="PROFILE / "..nextProfile:upper() end)
	local vignette; vignette=button("VIGNETTE / MEDIUM",316,280,function() UI.vignette=if UI.vignette==0.4 then 0.8 elseif UI.vignette==0.8 then 0 else 0.4; vignette.Text="VIGNETTE / "..(if UI.vignette==0 then "OFF" elseif UI.vignette==0.4 then "MEDIUM" else "HIGH") end); y+=44
	button("RECENTER / CALIBRATE",24,278,function() tracking.recenter(); remotes.Action:FireServer({action="Recenter"}) end)
	local seated; seated=button("POSTURE / STANDING",316,280,function() UI.seated=not UI.seated; seated.Text="POSTURE / "..(if UI.seated then "SEATED" else "STANDING"); tracking.recenter() end); y+=44
	local toggle; toggle=button("GRIP / HOLD",24,278,function() UI.toggleGrab=not UI.toggleGrab; toggle.Text="GRIP / "..(if UI.toggleGrab then "TOGGLE" else "HOLD") end)
	local dominant; dominant=button("DOMINANT / RIGHT",316,280,function() UI.dominant=if UI.dominant=="Right" then "Left" else "Right"; dominant.Text="DOMINANT / "..UI.dominant:upper() end); y+=44
	button("RESTORE LOST OBJECTS",24,278,function() remotes.Action:FireServer({action="RestoreObjects"}); UI.notice("Loose objects returned to their racks") end)
	button("RESET THIS CHECKPOINT",316,280,function() remotes.Action:FireServer({action="ResetCheckpoint"}); UI.open(false) end); y+=44
	button("SKIP TRAINING",24,278,function() remotes.Action:FireServer({action="SkipTutorial"}); UI.open(false) end)
	button("RESTART / REPEAT TRAINING",316,280,function() remotes.Action:FireServer({action="Restart"}); UI.open(false) end); y+=44
	local sensitivity=Instance.new("TextButton"); sensitivity.Name="Sensitivity"; sensitivity.Text="LOOK SENSITIVITY / 100%"; sensitivity.Size=UDim2.fromOffset(270,24); sensitivity.Position=UDim2.fromOffset(24,y); sensitivity.BackgroundTransparency=1; sensitivity.TextColor3=palette.ink; sensitivity.TextSize=12; sensitivity.Font=Enum.Font.GothamMedium; sensitivity.Parent=frame
	local function setSensitivity() input.sensitivity=if input.sensitivity==1 then 0.6 elseif input.sensitivity==0.6 then 1.4 else 1; sensitivity.Text="LOOK SENSITIVITY / "..math.floor(input.sensitivity*100).."%" end
	sensitivity.Activated:Connect(setSensitivity); UI.buttons[sensitivity]=setSensitivity; y+=24
	UI.debug=label(frame,"Diagnostic","",UDim2.fromOffset(24,y),UDim2.fromOffset(570,60),12,palette.cyan)
	if tracking.vr then
		menuGui.Enabled=false
		local panel=Instance.new("Part"); panel.Name="OrbitalComfortPanel"; panel.Anchored=true; panel.CanCollide=false; panel.CanQuery=false; panel.Transparency=1; panel.Size=Vector3.new(4.2,3.86,0.01); panel.Parent=workspace.CurrentCamera; UI.panel=panel
		local surface=Instance.new("SurfaceGui"); surface.Name="VRComfort"; surface.Face=Enum.NormalId.Front; surface.CanvasSize=Vector2.new(620,570); surface.AlwaysOnTop=true; surface.LightInfluence=0; surface.Adornee=panel; surface.Parent=Players.LocalPlayer.PlayerGui; UI.surface=surface
		for _,name in {"RayStart","RayEnd"} do
			local p=Instance.new("Part"); p.Name=name; p.Size=Vector3.one*0.03; p.Anchored=true; p.CanCollide=false; p.CanQuery=false; p.Transparency=1; p.Parent=workspace.CurrentCamera
			local a=Instance.new("Attachment"); a.Parent=p; UI[name]=p
		end
		local ray=Instance.new("Beam"); ray.Attachment0=UI.RayStart.Attachment; ray.Attachment1=UI.RayEnd.Attachment; ray.Width0=0.008; ray.Width1=0.015; ray.FaceCamera=true; ray.Color=ColorSequence.new(palette.cyan); ray.Parent=UI.RayStart; UI.ray=ray
		local cover=Instance.new("Part"); cover.Name="HeadsetFade"; cover.Anchored=true; cover.CanCollide=false; cover.CanQuery=false; cover.CastShadow=false; cover.Size=Vector3.new(4,4,0.005); cover.Color=Color3.new(); cover.Transparency=1; cover.Parent=workspace.CurrentCamera; UI.headFade=cover
		frame.Parent=surface; frame.AnchorPoint=Vector2.zero; frame.Position=UDim2.fromOffset(0,0)
		local wrist=panel:Clone(); wrist.Name="WristMissionCard"; wrist.Size=Vector3.new(2,0.9,0.01); wrist.Parent=workspace.CurrentCamera; UI.wrist=wrist
		local card=Instance.new("SurfaceGui"); card.Face=Enum.NormalId.Front; card.CanvasSize=Vector2.new(600,270); card.AlwaysOnTop=true; card.Adornee=wrist; card.Parent=Players.LocalPlayer.PlayerGui
		local background=Instance.new("Frame"); background.Size=UDim2.fromScale(1,1); background.BackgroundColor3=palette.bg; background.Parent=card
		UI.wristText=label(background,"Mission","",UDim2.fromOffset(20,20),UDim2.new(1,-40,1,-40),28,palette.ink)
		for i=1,24 do
			local p=Instance.new("Part"); p.Name="ComfortVignette"; p.Anchored=true; p.CanCollide=false; p.CanQuery=false; p.CanTouch=false; p.CastShadow=false; p.Color=Color3.new(); p.Material=Enum.Material.SmoothPlastic
			p.Size=Vector3.new(0.4,0.7,0.01); p.Transparency=1; p.Parent=workspace.CurrentCamera; UI.ring[i]=p
		end
	end
	UI.open(true)
end
function UI.open(value)
	UI.opened=value; UI.frame.Visible=value; UI.input.menu=value
	UIS.MouseBehavior=if value or UI.tracking.vr then Enum.MouseBehavior.Default else Enum.MouseBehavior.LockCenter
	UIS.MouseIconEnabled=value
	if value and UI.panel then
		local head=UI.tracking.head or workspace.CurrentCamera:GetRenderCFrame()
		UI.panel.CFrame=CFrame.new(head.Position)*CFrame.Angles(0,UI.tracking.yaw,0)*CFrame.new(0,0,-4.5)*CFrame.Angles(0,math.pi,0)
	end
	UI.locomotion.reset(); UI.remotes.Action:FireServer({action="Pause",value=value})
end
function UI.notice(text) UI.noticeLabel.Text=text; UI.noticeUntil=os.clock()+4 end
function UI.flash()
	UI.fade.BackgroundTransparency=0
	game:GetService("TweenService"):Create(UI.fade,TweenInfo.new(0.3),{BackgroundTransparency=1}):Play()
	UI.fadeUntil=os.clock()+0.3
end
function UI.vrClick(side)
	if not UI.panel or not UI.opened then return false end
	local cf=if side=="Left" then UI.tracking.left else UI.tracking.right
	local normal=UI.panel.CFrame.LookVector; local denominator=cf.LookVector:Dot(normal)
	if math.abs(denominator)<0.01 then return true end
	local distance=(UI.panel.Position-cf.Position):Dot(normal)/denominator
	if distance<0 or distance>12 then return true end
	local point=UI.panel.CFrame:PointToObjectSpace(cf.Position+cf.LookVector*distance)
	local x=(point.X/UI.panel.Size.X+0.5)*620; local y=(0.5-point.Y/UI.panel.Size.Y)*570
	for button,callback in UI.buttons do
		local p=button.Position; local s=button.Size
		if x>=p.X.Offset and x<=p.X.Offset+s.X.Offset and y>=p.Y.Offset and y<=p.Y.Offset+s.Y.Offset then callback(); break end
	end
	return true
end
function UI.render()
	local s=UI.state; local stage=s:GetAttribute("Stage") or 0; local definition=Definitions[stage]
	local hint=if stage==0 then Definitions.Tutorial[s:GetAttribute("Tutorial") or 1] else definition.Hint
	UI.title.Text="ORBITAL SHIFT   /   "..definition.Title
	UI.objective.Text=hint or ""; UI.hint.Text=UI.target.."   ·   Q/E grab  Z/C use  WASD+R/F hands  J/L turn  TAB menu  H recover"
	local velocity=UI.locomotion.root.AssemblyLinearVelocity.Magnitude
	UI.status.Text=string.format("%s / %.1f m/s\n%s\nL %s  ·  R %s",UI.locomotion.mode:upper(),velocity/3.57,UI.tracking.vr and "VR TRACKING" or "DESKTOP SIMULATION",UI.locomotion.grips.Left and "GRIP" or "FREE",UI.locomotion.grips.Right and "GRIP" or "FREE")
	UI.menuInfo.Text=stage==4 and ("SHIFT COMPLETE / "..tostring(math.floor((s:GetAttribute("Elapsed") or 0)/60)).." MIN\nPower restored · Signal locked · Research secured\nChoose restart or resume for free practice.") or (definition.Title.."\n"..(hint or ""))
	UI.debug.Text=(UI.input.engine or "").." / "..UI.input.profile.."\n"..UI.input.last.."\n"..(UI.input.raw or "Tracking diagnostics ready")
	if os.clock()>(UI.noticeUntil or 0) then UI.noticeLabel.Text="" end
	if UI.wrist then
		UI.wrist.CFrame=UI.tracking.left*CFrame.new(0,0.3,-0.25)*CFrame.Angles(-0.6,math.pi,0)
		UI.wristText.Text=definition.Title.."\n"..(hint or "").."\n"..UI.target
		local head=workspace.CurrentCamera:GetRenderCFrame()
		local aim=if UI.dominant=="Left" then UI.tracking.left else UI.tracking.right
		UI.RayStart.CFrame=aim; UI.RayEnd.CFrame=aim*CFrame.new(0,0,-5); UI.ray.Enabled=UI.opened
		UI.headFade.CFrame=head*CFrame.new(0,0,-0.3); UI.headFade.Transparency=if UI.fadeUntil then math.clamp(1-(UI.fadeUntil-os.clock())/0.3,0,1) else 1
		for i,p in UI.ring do
			local angle=i*math.pi*2/24
			p.CFrame=head*CFrame.new(math.cos(angle)*0.8,math.sin(angle)*0.65,-0.6)*CFrame.Angles(0,0,angle-math.pi/2)
			p.Transparency=if UI.fadeUntil and os.clock()<UI.fadeUntil then 0 else 1-UI.vignette*math.clamp(velocity/5,0,1)
		end
	end
end
return UI
