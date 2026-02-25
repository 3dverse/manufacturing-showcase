import type { Quat, Vec3 } from "@3dverse/livelink";
import type { Padding } from "./camera-v2";
import { add, rotateVec3ByQuat, scale } from "./math";

//------------------------------------------------------------------------------
export function normalizePadding(padding: Padding, minimum: number = 0.25) {
    if (1 - (padding.top + padding.bottom) < minimum) {
        // TODO
    }
    if (1 - (padding.left + padding.right) < minimum) {
        // TODO
    }
    return padding;
}

//------------------------------------------------------------------------------
export function dirFromAngle(theta: number): Vec3 {
    return [Math.cos(theta), Math.sin(theta), 0];
}

//------------------------------------------------------------------------------
// Debug
//------------------------------------------------------------------------------
export type DebugElement = { position: Vec3; label?: string | number };

//------------------------------------------------------------------------------
export function emitDebug3d(points: DebugElement[]) {
    window.dispatchEvent(new CustomEvent<DebugElement[]>("debug3d", { detail: points }));
}

//------------------------------------------------------------------------------
export function renderPlane(
    orientation: Quat,
    position: Vec3,
    distXneg?: number,
    distXpos?: number,
    distYneg?: number,
    distYpos?: number,
    distXnegproj?: number,
    distXposproj?: number,
    distYnegproj?: number,
    distYposproj?: number,
): DebugElement[] {
    const r = 1; // distance from center for axis markers

    // Plane-local axes (XY plane by default)
    const localX: Vec3 = [-1, 0, 0];
    const localY: Vec3 = [0, 1, 0];
    const localForward: Vec3 = [0, 0, 1]; // forward (+Z)

    const worldX = rotateVec3ByQuat(localX, orientation);
    const worldY = rotateVec3ByQuat(localY, orientation);
    const worldForward = rotateVec3ByQuat(localForward, orientation);

    const items = [
        { position: position, label: "C" },
        { position: add(position, scale(worldX, +r)), label: "X" },
        { position: add(position, scale(worldX, -r)), label: "X" },
        { position: add(position, scale(worldY, +r)), label: "Y" },
        { position: add(position, scale(worldY, -r)), label: "Y" },
        { position: add(position, scale(worldForward, +r)), label: "F" },
    ];

    if (distXneg) items.push({ position: add(position, scale(worldX, distXneg)), label: "-X" });
    if (distXpos) items.push({ position: add(position, scale(worldX, distXpos)), label: "+X" });
    if (distYneg) items.push({ position: add(position, scale(worldY, distYneg)), label: "-Y" });
    if (distYpos) items.push({ position: add(position, scale(worldY, distYpos)), label: "+Y" });

    if (distXnegproj) items.push({ position: add(position, scale(worldX, distXnegproj)), label: "-X`" });
    if (distXposproj) items.push({ position: add(position, scale(worldX, distXposproj)), label: "+X`" });
    if (distYnegproj) items.push({ position: add(position, scale(worldY, distYnegproj)), label: "-Y`" });
    if (distYposproj) items.push({ position: add(position, scale(worldY, distYposproj)), label: "+Y`" });

    return items;
}
