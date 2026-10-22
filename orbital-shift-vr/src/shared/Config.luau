--!strict
return {
	Version = "0.1.0", Namespace = "OrbitalShiftVR", MaxPlayers = 2,
	Physics = {BodyRadius=1.05, HandRadius=0.24, Reach=5.5, GrabRadius=0.85,
		MaxSpeed=7, MaxThrow=12, MaxSpin=10, BodyForce=850, HandForce=220,
		HandSpeed=18, GripForce=700, GripResponse=24, PullGain=7, PullDamping=2.5,
		SnapDegrees=30, PoseHz=25, PoseTimeout=0.65, TetherLength=29},
	Modes = {Assisted={Damping=0.28, Speed=5, Tolerance=0.9}, Inertial={Damping=0.035, Speed=7, Tolerance=0.65}},
	Socket = {Distance=1.35, Alignment=0.7, SettleSpeed=4},
	Signal = {Yaw=35, Pitch=-20, Tolerance=7, HoldSeconds=3},
	Checkpoints = {CFrame.new(0,5,7),CFrame.new(0,5,-24),CFrame.new(0,5,-51),CFrame.new(0,5,-77)},
	Bounds = {Min=Vector3.new(-34,-12,-135), Max=Vector3.new(34,26,25)},
	Profiles = {
		Quest={GrabLeft="ButtonL1",GrabRight="ButtonR1",UseLeft="ButtonL2",UseRight="ButtonR2",Menu="ButtonY",Recover="ButtonB"},
		["Pico / SteamVR"]={GrabLeft="ButtonL1",GrabRight="ButtonR1",UseLeft="ButtonL2",UseRight="ButtonR2",Menu="ButtonY",Recover="ButtonB"},
		["Swapped grips/triggers"]={GrabLeft="ButtonL2",GrabRight="ButtonR2",UseLeft="ButtonL1",UseRight="ButtonR1",Menu="ButtonY",Recover="ButtonB"},
	},
}
