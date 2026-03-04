import type { Quat, Vec3 } from "@3dverse/livelink";
import type { Padding } from "./camera-v2";
import { add, rotateVec3ByQuat, scale } from "./math";
import type { Point, QuadData } from "@/content/type";

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

//------------------------------------------------------------------------------
/**
 * Maps a rectangle [0..w, 0..h] to an arbitrary screen quad (tl,tr,br,bl)
 * and returns a CSS matrix3d(...) string.
 */
export function quadToMatrix3d({ quad, dimensions }: QuadData): string {
    const { width: w, height: h } = dimensions;
    const src: [Point, Point, Point, Point] = [
        { x: 0, y: 0 },
        { x: w, y: 0 },
        { x: w, y: h },
        { x: 0, y: h },
    ];

    const A: number[][] = [];
    const b: number[] = [];

    for (let i = 0; i < 4; i++) {
        const { x, y } = src[i];
        const { x: X, y: Y } = quad[i];

        // a*x + b*y + c - g*x*X - h*y*X = X
        A.push([x, y, 1, 0, 0, 0, -x * X, -y * X]);
        b.push(X);

        // d*x + e*y + f - g*x*Y - h*y*Y = Y
        A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]);
        b.push(Y);
    }

    const [a, b2, c, d, e, f, g, h2] = solveLinearSystem(A, b);

    // CSS matrix3d is column-major:
    // x' = (a*x + b*y + c) / (g*x + h*y + 1)
    // y' = (d*x + e*y + f) / (g*x + h*y + 1)
    return `matrix3d(${[a, d, 0, g, b2, e, 0, h2, 0, 0, 1, 0, c, f, 0, 1].join(",")})`;
}

//------------------------------------------------------------------------------
function solveLinearSystem(A: number[][], b: number[]): number[] {
    const n = b.length;
    const M = A.map((row, i) => [...row, b[i]]);

    for (let col = 0; col < n; col++) {
        // Pivot
        let pivot = col;
        for (let r = col + 1; r < n; r++) {
            if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
        }
        if (Math.abs(M[pivot][col]) < 1e-12) {
            // new Error("Singular matrix: quad is degenerate");
            //console.error("Singular matrix: quad is degenerate");
            return [];
        }
        [M[col], M[pivot]] = [M[pivot], M[col]];

        // Normalize row
        const div = M[col][col];
        for (let c = col; c <= n; c++) M[col][c] /= div;

        // Eliminate
        for (let r = 0; r < n; r++) {
            if (r === col) continue;
            const factor = M[r][col];
            for (let c = col; c <= n; c++) M[r][c] -= factor * M[col][c];
        }
    }

    return M.map((row) => row[n]);
}
