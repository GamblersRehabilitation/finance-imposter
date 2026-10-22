--!strict
local U = {}
function U.finite(n: any): boolean return type(n)=="number" and n==n and math.abs(n)<1e8 end
function U.vector(v: any): boolean return typeof(v)=="Vector3" and U.finite(v.X) and U.finite(v.Y) and U.finite(v.Z) end
function U.frame(v: any): boolean
	if typeof(v)~="CFrame" then return false end
	for _,n in {v:GetComponents()} do if not U.finite(n) then return false end end
	return true
end
function U.clamp(v: Vector3, n: number): Vector3 return if v.Magnitude>n then v.Unit*n else v end
function U.surface(part: BasePart, point: Vector3): Vector3
	local p=part.CFrame:PointToObjectSpace(point); local h=part.Size/2
	return part.CFrame:PointToWorldSpace(Vector3.new(math.clamp(p.X,-h.X,h.X),math.clamp(p.Y,-h.Y,h.Y),math.clamp(p.Z,-h.Z,h.Z)))
end
function U.inside(v: Vector3, lo: Vector3, hi: Vector3): boolean
	return v.X>=lo.X and v.X<=hi.X and v.Y>=lo.Y and v.Y<=hi.Y and v.Z>=lo.Z and v.Z<=hi.Z
end
function U.scaled(cf: CFrame, scale: number): CFrame return cf.Rotation+cf.Position*scale end
function U.bucket(bucket, key, rate: number, capacity: number): boolean
	local now=os.clock(); local b=bucket[key]
	if not b then b={n=capacity,t=now}; bucket[key]=b end
	b.n=math.min(capacity,b.n+(now-b.t)*rate); b.t=now
	if b.n<1 then return false end; b.n-=1; return true
end
return U
