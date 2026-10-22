-- Read-only export of anchored visual geometry for the standalone XML place.
-- Runtime WorldBuilder replaces this attribute-free preview with the fully tagged world.
local root=workspace.OrbitalShiftVR
local parts={}
for _,p in root:GetDescendants() do
	if p:IsA("Part") then
		local t={name=p.Name,size={p.Size.X,p.Size.Y,p.Size.Z},cf={p.CFrame:GetComponents()},color={p.Color.R,p.Color.G,p.Color.B},
			material=p.Material.Value,shape=p.Shape.Value,transparency=p.Transparency,collide=p.CanCollide,labels={}}
		for _,s in p:GetChildren() do if s:IsA("SurfaceGui") then
			local text=s:FindFirstChildWhichIsA("TextLabel")
			if text then table.insert(t.labels,{text=text.Text,color={text.TextColor3.R,text.TextColor3.G,text.TextColor3.B},face=s.Face.Value}) end
		end end
		table.insert(parts,t)
	end
end
return {parts=parts}
