import type { Quat, Vec3 } from "@3dverse/livelink";
import type { Padding } from "./camera";
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
export type DebugPoint = { position: Vec3; label?: string | number; title?: string };
export type DebugQuad = { quad: { tl: Vec3; tr: Vec3; br: Vec3; bl: Vec3 }; label?: string | number; title?: string; className?: string };
export type DebugElement = DebugPoint | DebugQuad;

//------------------------------------------------------------------------------
export function emitDebug3d(points: DebugElement[]) {
    window.dispatchEvent(new CustomEvent<DebugElement[]>("debug3d", { detail: points }));
}

//------------------------------------------------------------------------------
export type PlaneRect = { xMin: number; xMax: number; yMin: number; yMax: number };

//------------------------------------------------------------------------------
export function renderPlane(
    orientation: Quat,
    position: Vec3,
    plane?: PlaneRect,
    projection?: PlaneRect,
): DebugElement[] {
    const localRight: Vec3 = [1, 0, 0];
    const localUp: Vec3 = [0, 1, 0];

    const worldRight = rotateVec3ByQuat(localRight, orientation);
    const worldUp = rotateVec3ByQuat(localUp, orientation);

    const makeQuad = (r: PlaneRect, label: string, className: string): DebugQuad => ({
        label,
        className,
        quad: {
            tl: add(position, add(scale(worldRight, r.xMin), scale(worldUp, r.yMin))),
            tr: add(position, add(scale(worldRight, r.xMax), scale(worldUp, r.yMin))),
            br: add(position, add(scale(worldRight, r.xMax), scale(worldUp, r.yMax))),
            bl: add(position, add(scale(worldRight, r.xMin), scale(worldUp, r.yMax))),
        },
    });

    const items: DebugElement[] = [];
    if (plane) items.push(makeQuad(plane, "plane", "bg-blue-500/20 border-dashed border-2 border-blue-600/80"));
    if (projection) items.push(makeQuad(projection, "projection", "bg-orange-500/20 border-dashed border-2 border-orange-600/80"));
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
