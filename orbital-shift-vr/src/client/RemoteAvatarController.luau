local A={avatars={}}
function A.init(remote)
	remote.OnClientEvent:Connect(function(id,data)
		if id==game.Players.LocalPlayer.UserId or type(data)~="table" or not data.tracked or not data.head then return end
		local a=A.avatars[id]
		if not a then
			a={seq=-1,parts={}}; A.avatars[id]=a
			for _,key in {"head","left","right"} do
				local p=Instance.new("Part"); p.Name="CrewPose_"..id.."_"..key; p.Shape=Enum.PartType.Ball
				p.Size=Vector3.one*(if key=="head" then 0.85 else 0.4); p.Anchored=true; p.CanCollide=false; p.CanQuery=false; p.Material=Enum.Material.SmoothPlastic
				p.Color=if key=="head" then Color3.fromRGB(220,219,202) elseif key=="left" then Color3.fromRGB(88,221,223) else Color3.fromRGB(246,126,49)
				p.Parent=workspace.CurrentCamera; a.parts[key]=p; p.CFrame=data[key]
			end
		end
		if data.seq<=a.seq then return end
		a.seq=data.seq; a.data=data; a.time=os.clock()
	end)
	game.Players.PlayerRemoving:Connect(function(player)
		local a=A.avatars[player.UserId]; if a then for _,p in a.parts do p:Destroy() end; A.avatars[player.UserId]=nil end
	end)
end
function A.render(dt)
	for _,a in A.avatars do
		if a.data then for key,p in a.parts do p.CFrame=p.CFrame:Lerp(a.data[key],math.min(1,dt*18)); p.Transparency=if os.clock()-a.time>1 then 1 else 0 end end
	end
end
return A
