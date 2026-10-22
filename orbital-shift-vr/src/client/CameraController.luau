local C={}
function C.init(tracking)
	C.tracking=tracking
	local camera=workspace.CurrentCamera
	camera.CameraType=Enum.CameraType.Scriptable; camera.HeadLocked=true; camera.VRTiltAndRollEnabled=false; camera.FieldOfView=78
end
function C.render()
	local camera=workspace.CurrentCamera; local t=C.tracking
	camera.CameraType=Enum.CameraType.Scriptable; camera.CFrame=t.origin
	camera.Focus=CFrame.new((t.head or t.origin).Position+(t.head or t.origin).LookVector*12)
	-- HeadLocked adds the scaled physical head pose once. origin must not contain that pose.
	C.renderedHead=camera:GetRenderCFrame()
end
return C
