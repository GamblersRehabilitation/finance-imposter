-- Original primitive-built station; no Toolbox code or runtime asset dependencies.
local Collection=game:GetService("CollectionService")
local W={}
local C={Ivory=Color3.fromRGB(220,219,202), Navy=Color3.fromRGB(20,36,53), Orange=Color3.fromRGB(246,126,49),
	Cyan=Color3.fromRGB(88,221,223), Green=Color3.fromRGB(112,228,158), Red=Color3.fromRGB(239,85,69), Metal=Color3.fromRGB(85,104,115)}
W.Colors=C
local root,station,items
local function part(parent,name,size,cf,color,anchored)
	local p=Instance.new("Part"); p.Name=name; p.Size=size; p.CFrame=cf; p.Color=color or C.Ivory
	p.Material=Enum.Material.SmoothPlastic; p.Anchored=anchored~=false; p.TopSurface=Enum.SurfaceType.Smooth; p.BottomSurface=Enum.SurfaceType.Smooth
	p.CustomPhysicalProperties=PhysicalProperties.new(1,0.5,0,1,1); p.Parent=parent; return p
end
local function tag(p,kind,id)
	Collection:AddTag(p,"OSInteractable"); p:SetAttribute("Kind",kind); p:SetAttribute("Id",id or p.Name); p:SetAttribute("Label",p.Name)
	return p
end
local function sign(parent,name,text,cf,width,height,color)
	local p=part(parent,name,Vector3.new(width,height,0.12),cf,C.Navy)
	p.CanCollide=false; p.CanQuery=false
	local gui=Instance.new("SurfaceGui"); gui.Face=Enum.NormalId.Front; gui.SizingMode=Enum.SurfaceGuiSizingMode.PixelsPerStud; gui.PixelsPerStud=65; gui.LightInfluence=0; gui.Parent=p
	local pad=Instance.new("UIPadding"); pad.PaddingLeft=UDim.new(0,10); pad.PaddingRight=UDim.new(0,10); pad.Parent=gui
	local t=Instance.new("TextLabel"); t.Name="Text"; t.Size=UDim2.fromScale(1,1); t.BackgroundTransparency=1
	t.Text=text; t.TextColor3=color or C.Ivory; t.Font=Enum.Font.GothamMedium; t.TextScaled=true; t.TextWrapped=true; t.Parent=gui
	return p
end
local function rail(cf,len,name)
	local p=tag(part(items,name or "Handrail",Vector3.new(len or 4,0.24,0.24),cf,C.Orange),"Rail")
	p.Material=Enum.Material.Metal
	for _,x in {-p.Size.X/2+0.15,p.Size.X/2-0.15} do
		part(station,"RailBracket",Vector3.new(0.18,0.45,0.3),cf*CFrame.new(x,-0.3,0),C.Metal)
	end
	return p
end
local function loose(id,kind,pos,size,color,density)
	local p=tag(part(items,id,size,CFrame.new(pos),color,false),"Loose",id)
	p:SetAttribute("ItemType",kind); p:SetAttribute("Home",p.CFrame); p:SetAttribute("Docked",false)
	p.CustomPhysicalProperties=PhysicalProperties.new(density or 0.8,0.5,0.05,1,1)
	p.Material=Enum.Material.Metal
	local a=Instance.new("Attachment"); a.Name="CableAttachment"; a.Parent=p
	local stripe=part(p,"IdentityStripe",Vector3.new(size.X+0.02,0.12,size.Z+0.02),p.CFrame,color)
	stripe.CanCollide=false; stripe.CanQuery=false; stripe.Massless=true; stripe.Anchored=false
	local weld=Instance.new("WeldConstraint"); weld.Part0=p; weld.Part1=stripe; weld.Parent=stripe
	return p
end
local function socket(id,kind,pos,color,stage)
	local p=tag(part(items,id,Vector3.new(1.55,1.8,0.4),CFrame.new(pos),C.Navy),"Socket",id)
	p:SetAttribute("Accepts",kind); p:SetAttribute("MinStage",stage or 0); p:SetAttribute("Occupied",false)
	local a=Instance.new("Attachment"); a.Name="Dock"; a.Position=Vector3.new(0,0,0.7); a.Parent=p
	for _,x in {-0.85,0.85} do part(station,"DockGuide",Vector3.new(0.1,1.8,0.6),p.CFrame*CFrame.new(x,0,0.2),color) end
	sign(station,id.."Label",id:upper(),p.CFrame*CFrame.new(0,1.45,0.05)*CFrame.Angles(0,math.pi,0),3,0.65,color)
	return p
end
local function machine(id,pos,kind,minStage)
	local base=part(station,id.."Base",Vector3.new(2,2.3,0.45),CFrame.new(pos),C.Navy)
	local moving=tag(part(items,id,if kind=="Wheel" then Vector3.new(1.6,1.6,0.3) else Vector3.new(0.3,1.65,0.3),base.CFrame*CFrame.new(0,0,0.5),C.Orange,false),kind,id)
	moving:SetAttribute("MinStage",minStage or 0)
	if kind=="Wheel" then moving.Shape=Enum.PartType.Cylinder; moving.Size=Vector3.new(0.3,1.7,1.7); moving.CFrame*=CFrame.Angles(0,math.pi/2,0) end
	local a=Instance.new("Attachment"); a.Name="Pivot"; a.CFrame=base.CFrame:ToObjectSpace(moving.CFrame); a.Parent=base
	local b=Instance.new("Attachment"); b.Parent=moving
	-- Wheel local X is its axle. Lever rotates around the panel normal (world Z).
	if kind=="Lever" then a.CFrame=CFrame.new(0,-0.6,0.5)*CFrame.Angles(0,math.pi/2,0); b.CFrame=CFrame.new(0,-0.6,0)*CFrame.Angles(0,math.pi/2,0) end
	local h=Instance.new("HingeConstraint"); h.Name="Mechanism"; h.Attachment0=a; h.Attachment1=b
	h.ActuatorType=Enum.ActuatorType.Servo; h.AngularSpeed=1.5; h.ServoMaxTorque=800; h.LimitsEnabled=true
	h.LowerAngle=if kind=="Wheel" then -90 else -35; h.UpperAngle=if kind=="Wheel" then 90 else 35
	h.TargetAngle=if kind=="Lever" then -35 else 0; h.Parent=moving
	moving:SetAttribute("Setpoint",h.TargetAngle)
	sign(station,id.."Label",id:upper(),base.CFrame*CFrame.new(0,1.8,0.05)*CFrame.Angles(0,math.pi,0),3.3,0.6,C.Orange)
	return moving
end
local function button(id,pos,label,stage)
	local p=tag(part(items,id,Vector3.new(0.8,0.8,0.25),CFrame.new(pos),C.Orange),"Button",id)
	p:SetAttribute("MinStage",stage or 0); p:SetAttribute("Rest",p.CFrame)
	sign(station,id.."Label",label,p.CFrame*CFrame.new(0,0.9,0)*CFrame.Angles(0,math.pi,0),3,0.65)
	return p
end
local function door(id,z,width)
	local anchor=part(station,id.."Frame",Vector3.new(width+1,0.6,0.8),CFrame.new(0,11.5,z),C.Orange)
	local d=tag(part(items,id,Vector3.new(width,10,0.65),CFrame.new(0,5.8,z),C.Navy,false),"Door",id)
	local a=Instance.new("Attachment"); a.CFrame=CFrame.new(0,-5.7,0)*CFrame.Angles(0,0,math.pi/2); a.Parent=anchor
	local b=Instance.new("Attachment"); b.CFrame=CFrame.Angles(0,0,math.pi/2); b.Parent=d
	local slide=Instance.new("PrismaticConstraint"); slide.Name="Mechanism"; slide.Attachment0=a; slide.Attachment1=b
	slide.LimitsEnabled=true; slide.LowerLimit=0; slide.UpperLimit=10.5; slide.ActuatorType=Enum.ActuatorType.Servo
	slide.Speed=4; slide.ServoMaxForce=25000; slide.TargetPosition=0; slide.Parent=d
	d:SetAttribute("Open",false)
	for _,x in {-width/2+0.3,width/2-0.3} do
		local p=part(d,"WarningStripe",Vector3.new(0.15,9.5,0.69),d.CFrame*CFrame.new(x,0,0),C.Orange,false)
		p.Massless=true; p.CanCollide=false; p.CanQuery=false
		local weld=Instance.new("WeldConstraint"); weld.Part0=d; weld.Part1=p; weld.Parent=p
	end
	return d
end
local function room(name,z,length,width)
	local f=Instance.new("Folder"); f.Name=name; f.Parent=station
	part(f,"Deck",Vector3.new(width,0.8,length),CFrame.new(0,-0.4,z),C.Navy)
	part(f,"Ceiling",Vector3.new(width,0.45,length),CFrame.new(0,12.2,z),C.Ivory)
	for _,x in {-width/2,width/2} do
		part(f,"HullLower",Vector3.new(0.55,3,length),CFrame.new(x,1.5,z),C.Ivory)
		part(f,"HullUpper",Vector3.new(0.55,3,length),CFrame.new(x,10.5,z),C.Ivory)
		local pane=part(f,"ObservationGlass",Vector3.new(0.2,6,length),CFrame.new(x,6,z),C.Cyan); pane.Transparency=0.82; pane.Material=Enum.Material.Glass
		for k=-length/2+2,length/2-1,5 do
			part(f,"Rib",Vector3.new(0.8,12,0.5),CFrame.new(x,6,z+k),C.Metal)
			rail(CFrame.new(x*0.91,4.8,z+k)*CFrame.Angles(0,math.pi/2,0),4)
		end
	end
	for k=-length/2+1,length/2-1,4 do
		part(f,"DeckTile",Vector3.new(width-1,0.06,3.85),CFrame.new(0,0.04,z+k),C.Metal)
		part(f,"GuideLine",Vector3.new(0.12,0.07,3),CFrame.new(0,0.1,z+k),C.Orange)
	end
	for _,x in {-4,4} do
		local strip=part(f,"LightStrip",Vector3.new(0.15,0.1,length-2),CFrame.new(x,11.85,z),C.Ivory); strip.Material=Enum.Material.Neon
	end
	for k=-length/2+3,length/2-1,5 do rail(CFrame.new(-2.6,5.1,z+k),4); rail(CFrame.new(2.6,5.1,z+k),4) end
	-- The middle rails form a continuous reachable route even for seated players.
	part(f,"UtilityPipe",Vector3.new(0.35,0.35,length),CFrame.new(-width/2+1,10,z),C.Orange)
	task.wait()
	return f
end
function W.build(trainingOnly)
	root=workspace:FindFirstChild("OrbitalShiftVR")
	if root then
		if root:GetAttribute("BuiltPhase") then return root end
		-- A source-controlled XML place can include an anchored edit preview.
		-- Replace only our preview namespace with the fully attributed runtime world.
		root:Destroy()
	end
	root=Instance.new("Model"); root.Name="OrbitalShiftVR"; root.ModelStreamingMode=Enum.ModelStreamingMode.Persistent; root.Parent=workspace
	station=Instance.new("Folder"); station.Name="Station"; station.Parent=root
	items=Instance.new("Folder"); items.Name="Interactables"; items.Parent=root
	for _,name in {"Rigs","Checkpoints"} do local f=Instance.new("Folder"); f.Name=name; f.Parent=root end
	workspace.Gravity=0
	local lighting=game:GetService("Lighting"); lighting.ClockTime=0; lighting.Brightness=2
	lighting.GlobalShadows=false; lighting.Ambient=Color3.fromRGB(150,157,168); lighting.OutdoorAmbient=Color3.fromRGB(130,140,155)
	lighting.EnvironmentDiffuseScale=0.6; lighting.EnvironmentSpecularScale=0.5
	room("Training",3,24,22)
	rail(CFrame.new(0,5.7,4.8),3.5,"FirstHandrail")
	part(station,"AftBulkhead",Vector3.new(22,12,0.5),CFrame.new(0,6,15),C.Ivory)
	sign(station,"Title","ORBITAL\nSHIFT",CFrame.new(0,8,-8)*CFrame.Angles(0,math.pi,0),8,3,C.Orange)
	sign(station,"Welcome","ZERO GRAVITY / TWO HANDS / ONE CREW\nGrab orange. Carry cyan. Recover with H.",CFrame.new(-5.7,7.6,-4)*CFrame.Angles(0,math.pi,0),7,1.5)
	-- Panels face +Z: Front surface is local -Z, hence a 180° yaw.
	local cell=loose("PracticeCell","Practice",Vector3.new(3.2,5.7,4),Vector3.new(0.6,1,0.6),C.Cyan)
	local dock=socket("PracticeDock","Practice",Vector3.new(3.2,5.7,0),C.Cyan)
	button("SkipTutorial",Vector3.new(-3,6,0),"SKIP / REPEAT IN MENU",0)
	root:SetAttribute("BuiltPhase","Training")
	if not trainingOnly then W.extend() end
	return root
end
function W.extend()
	root=workspace:FindFirstChild("OrbitalShiftVR"); station=root.Station; items=root.Interactables
	if root:GetAttribute("BuiltPhase")=="Complete" then return end
	room("Maintenance",-24,30,22); room("Observatory",-54,30,24); room("Airlock",-77,16,16)
	for _,x in {-8,8} do part(station,"PowerBulkhead",Vector3.new(6,12,0.8),CFrame.new(x,6,-39),C.Ivory) end
	door("PowerDoor",-39,10)
	loose("CellA","Energy",Vector3.new(-4.5,5.8,-17),Vector3.new(0.65,1.15,0.65),C.Orange)
	loose("CellB","Energy",Vector3.new(4.5,6,-27),Vector3.new(0.65,1.15,0.65),C.Orange)
	socket("PowerA","Energy",Vector3.new(-3,5.8,-33),C.Orange,1); socket("PowerB","Energy",Vector3.new(3,5.8,-33),C.Orange,1)
	machine("MainLever",Vector3.new(0,6,-33),"Lever",1)
	sign(station,"PowerSign","01  /  MAINTENANCE\nTWO CELLS. ONE SWITCH.",CFrame.new(0,9.5,-34)*CFrame.Angles(0,math.pi,0),9,1.7,C.Orange)
	local p1=loose("CableEndA","CableA",Vector3.new(-4,5.5,-46),Vector3.new(0.55,0.7,0.55),C.Cyan)
	local p2=loose("CableEndB","CableB",Vector3.new(3.5,5.5,-48),Vector3.new(0.55,0.7,0.55),C.Cyan)
	local cable=Instance.new("Beam"); cable.Name="SignalCable"; cable.Attachment0=p1.CableAttachment; cable.Attachment1=p2.CableAttachment
	cable.Width0=0.09; cable.Width1=0.09; cable.CurveSize0=1.5; cable.CurveSize1=-1.5; cable.Segments=8
	cable.Color=ColorSequence.new(C.Cyan); cable.FaceCamera=true; cable.Parent=p1
	socket("CableSource","CableA",Vector3.new(-4,5.5,-52),C.Cyan,2); socket("CableReceiver","CableB",Vector3.new(4,5.5,-57),C.Cyan,2)
	machine("YawWheel",Vector3.new(-1.8,5.8,-62),"Wheel",2); machine("PitchWheel",Vector3.new(1.8,5.8,-62),"Wheel",2)
	sign(station,"SignalReadout","SIGNAL 00%\nTARGET 35° / −20°",CFrame.new(0,8.7,-63)*CFrame.Angles(0,math.pi,0),7.5,1.8,C.Cyan)
	local mast=part(station,"AntennaPedestal",Vector3.new(0.5,3,0.5),CFrame.new(8,13,-56),C.Metal)
	local dish=part(items,"AntennaDish",Vector3.new(4,0.3,4),CFrame.new(8,15,-56),C.Ivory); dish.Shape=Enum.PartType.Cylinder
	part(station,"TargetBeacon",Vector3.new(1.5,1.5,1.5),CFrame.new(32,28,-96),C.Cyan).Material=Enum.Material.Neon
	for _,z in {-69,-85} do
		for _,x in {-6.5,6.5} do part(station,"LockBulkhead",Vector3.new(3,12,0.8),CFrame.new(x,6,z),C.Ivory) end
	end
	door("InnerHatch",-69,10); door("OuterHatch",-85,10)
	button("InnerControl",Vector3.new(-3,5.6,-67),"INNER HATCH",3)
	button("InnerControlInside",Vector3.new(-5.7,5.6,-73),"INNER HATCH",3)
	button("Equalize",Vector3.new(3,5.6,-78),"EQUALIZE / REPRESSURIZE",3)
	button("TetherClip",Vector3.new(-3,5.6,-79),"CLIP SAFETY TETHER",3)
	machine("OuterWheel",Vector3.new(0,5.8,-82),"Wheel",3)
	socket("ResearchDock","Research",Vector3.new(4.8,5.8,-80),C.Green,3)
	sign(station,"EvaSign","03  /  EVA RECOVERY\nSEAL → EQUALIZE → TETHER → OPEN",CFrame.new(0,9,-81)*CFrame.Angles(0,math.pi,0),10,1.3,C.Orange)
	part(station,"ExteriorDeck",Vector3.new(14,0.6,34),CFrame.new(0,-0.3,-102),C.Navy)
	for _,x in {-6,6} do
		for z=-88,-116,-4 do rail(CFrame.new(x,4.8,z)*CFrame.Angles(0,math.pi/2,0),3.8) end
	end
	for z=-88,-116,-4 do rail(CFrame.new(0,5,-z*-1),4) end
	local crate=loose("ResearchCase","Research",Vector3.new(0,5.8,-110),Vector3.new(1.15,1.1,1.1),C.Green,5)
	crate:SetAttribute("Label","RESEARCH / HEAVY CASE")
	part(station,"ResearchCradle",Vector3.new(3,0.5,3),CFrame.new(0,4.6,-110),C.Metal)
	sign(station,"OutsideSign","K-07 / RESEARCH ARRAY\nKEEP YOUR LINE ATTACHED",CFrame.new(0,8,-117)*CFrame.Angles(0,math.pi,0),10,1.4,C.Green)
	local space=Instance.new("Folder"); space.Name="OrbitalView"; space.Parent=station
	local planet=part(space,"Pelagos",Vector3.new(160,160,160),CFrame.new(145,-105,-200),Color3.fromRGB(48,117,159)); planet.Shape=Enum.PartType.Ball; planet.CanCollide=false; planet.CanQuery=false
	local cap=part(space,"PolarClouds",Vector3.new(146,146,146),CFrame.new(149,-98,-201),Color3.fromRGB(150,199,204)); cap.Shape=Enum.PartType.Ball; cap.CanCollide=false; cap.CanQuery=false
	local rng=Random.new(10718)
	for i=1,46 do
		local star=part(space,"Star",Vector3.one*rng:NextNumber(0.2,0.6),CFrame.new(rng:NextNumber(-260,260),rng:NextNumber(50,200),rng:NextNumber(-300,-150)),C.Ivory)
		star.Material=Enum.Material.Neon; star.CanCollide=false; star.CanQuery=false
	end
	local Config=require(game.ReplicatedStorage.OrbitalShiftVR.Shared.Config)
	for i,cf in Config.Checkpoints do
		local checkpoint=part(root.Checkpoints,"Checkpoint"..i,Vector3.one,cf,C.Green); checkpoint.Transparency=1; checkpoint.CanCollide=false; checkpoint.CanQuery=false
	end
	root:SetAttribute("BuiltPhase","Complete")
	return root
end
return W
