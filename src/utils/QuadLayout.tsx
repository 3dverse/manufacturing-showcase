import { useCallback, useContext, useMemo, useState, type HTMLAttributes } from "react";
import type { Entity, Vec3 } from "@3dverse/livelink";
import { DOM3DElement, ViewportContext } from "@3dverse/livelink-react";
import { cn } from "./cn";

//------------------------------------------------------------------------------
export type Point = { x: number; y: number };
export type QuadPoint = [Point, Point, Point, Point];
type QuadData = {
    quad: QuadPoint;
    dimensions: { width: number; height: number };
};
type Quad = [Vec3, Vec3, Vec3, Vec3]; // tl, tr, br, bl

//------------------------------------------------------------------------------
function computeBoundingBoxQuads(entity: Entity) {
    const min = entity.global_aabb.min;
    const max = entity.global_aabb.max;

    const leftBottomBack: Vec3 = [min[0], min[1], min[2]];
    const leftBottomFront: Vec3 = [min[0], min[1], max[2]];
    const rightBottomBack: Vec3 = [max[0], min[1], min[2]];
    const rightBottomFront: Vec3 = [max[0], min[1], max[2]];

    const leftTopBack: Vec3 = [min[0], max[1], min[2]];
    const leftTopFront: Vec3 = [min[0], max[1], max[2]];
    const rightTopBack: Vec3 = [max[0], max[1], min[2]];
    const rightTopFront: Vec3 = [max[0], max[1], max[2]];

    const front: Quad = [leftTopFront, rightTopFront, rightBottomFront, leftBottomFront];
    const back: Quad = [rightTopBack, leftTopBack, leftBottomBack, rightBottomBack];
    const top: Quad = [rightTopBack, leftTopBack, leftTopFront, rightTopFront];
    const bottom: Quad = [leftBottomBack, rightBottomBack, rightBottomFront, leftBottomFront];
    const left: Quad = [leftTopBack, leftTopFront, leftBottomFront, leftBottomBack];
    const right: Quad = [rightTopFront, rightTopBack, rightBottomBack, rightBottomFront];

    return { front, back, top, bottom, left, right };
}

//------------------------------------------------------------------------------
export function QuadLayout({
    entity,
    face,
    outskirt = 100,
    scale = 100,
    debug,
    invert,
    center,
    top,
    right,
    bottom,
    left,
    className,
    ...divProps
}: {
    entity: Entity;
    face: "front" | "back" | "left" | "right" | "top" | "bottom";
    outskirt?: number;
    scale?: number;
    debug?: boolean;
    invert?: boolean;
    center?: React.ReactNode;
    top?: React.ReactNode;
    right?: React.ReactNode;
    bottom?: React.ReactNode;
    left?: React.ReactNode;
    className?: string;
} & HTMLAttributes<HTMLDivElement>) {
    const faces = computeBoundingBoxQuads(entity);
    const { viewport } = useContext(ViewportContext);
    const [, setProjectionTick] = useState(0);
    const handleProjectionChange = useCallback(() => {
        setProjectionTick((tick) => tick + 1);
    }, []);
    const faceQuad = faces[face];
    const dimensions = useMemo(() => {
        if (!faceQuad) return null;

        const wDim = face === "left" || face === "right" ? 2 : 0;
        const hDim = face === "top" || face === "bottom" ? 2 : 1;

        return {
            width: Math.abs(faceQuad[1][wDim] - faceQuad[0][wDim]) * scale,
            height: Math.abs(faceQuad[3][hDim] - faceQuad[0][hDim]) * scale,
        };
    }, [faceQuad, face, scale]);

    function doInvert(quad: QuadPoint): QuadPoint {
        return invert ? [quad[1], quad[0], quad[3], quad[2]] : quad;
    }

    const projectedQuad =
        viewport && viewport.camera_projection && faceQuad
            ? doInvert(
                  faceQuad.map((p) => {
                      const [x, y] = viewport.projectWorldToScreen({
                          world_position: p,
                      });
                      return { x, y } as Point;
                  }) as QuadPoint,
              )
            : null;

    if (!projectedQuad || !dimensions) return null;

    const baseW = dimensions.width;
    const baseH = dimensions.height;

    return (
        <>
            <DOM3DElement worldPosition={[0, 0, 0]} onProjectionChange={handleProjectionChange}>
                <span />
            </DOM3DElement>
            <div
                className={cn(
                    "absolute left-0 top-0 origin-top-left w-full h-full pointer-events-auto text-4xl",
                    className,
                )}
                style={{
                    width: dimensions.width,
                    height: dimensions.height,
                    transform: quadToMatrix3d({ quad: projectedQuad, dimensions }),
                }}
                {...divProps}
            >
                {(center || debug) && (
                    <div className="absolute left-0 top-0 w-full h-full">
                        {debug && <DebugQuadrant quadrant="center" />}
                        {center}
                    </div>
                )}

                {(left || debug) && (
                    <div
                        className="absolute flex justify-end"
                        style={{ left: -outskirt, top: 0, width: outskirt, height: baseH }}
                    >
                        {debug && <DebugQuadrant quadrant="left" />}
                        {left}
                    </div>
                )}

                {(top || debug) && (
                    <div
                        className="absolute flex justify-end items-end"
                        style={{ left: 0, top: -outskirt, width: baseW, height: outskirt }}
                    >
                        {debug && <DebugQuadrant quadrant="top" />}
                        {top}
                    </div>
                )}

                {(right || debug) && (
                    <div className="absolute" style={{ left: baseW, top: 0, width: outskirt, height: baseH }}>
                        {debug && <DebugQuadrant quadrant="right" />}
                        {right}
                    </div>
                )}

                {(bottom || debug) && (
                    <div className="absolute" style={{ left: 0, top: baseH, width: baseW, height: outskirt }}>
                        {debug && <DebugQuadrant quadrant="bottom" />}
                        {bottom}
                    </div>
                )}
            </div>
        </>
    );
}

function DebugQuadrant({ quadrant }: { quadrant: "center" | "top" | "right" | "bottom" | "left" }) {
    const color = {
        center: "bg-red-500/50",
        top: "bg-blue-500/50",
        right: "bg-green-500/50",
        bottom: "bg-pink-500/50",
        left: "bg-yellow-500/50",
    } as Record<string, string>;

    return (
        <div className={`absolute top-0 left-0 w-full h-full ${color[quadrant]} text-xl text-center content-center`}>
            {quadrant.toUpperCase()}
        </div>
    );
}

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
