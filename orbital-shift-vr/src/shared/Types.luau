--!strict
export type Hand = "Left" | "Right"
export type Grip = {part: BasePart, localAnchor: Vector3, kind: string, offset: CFrame?}
export type Snapshot = {stage: number, tutorial: number, signal: number, elapsed: number, revision: number}
export type Pose = {seq: number, head: CFrame, left: CFrame, right: CFrame, tracked: boolean}
return {}
