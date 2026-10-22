-- Only for the controlled server integration fixture, in a fresh Play session.
-- Stop Play afterward. These overrides deliberately suspend local tracking/locomotion.
-- This tests mission rules and real constrained mechanisms, not a human playthrough.
local f=game.Players.LocalPlayer.PlayerScripts.OrbitalShiftVR
local ui=require(f.UIController); ui.open(false)
game:GetService("RunService"):UnbindFromRenderStep("OrbitalShiftTracking")
local locomotion=require(f.LocomotionController); locomotion.step=function() end; locomotion.onOverlap=nil
require(f.VRTrackingController).onReset=nil
ui.open=function() end
setmetatable(require(f.InteractionController).desired,{__index=function() return true end})
