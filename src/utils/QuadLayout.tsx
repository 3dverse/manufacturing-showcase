import { useCallback, useContext, useMemo, useState, type HTMLAttributes } from "react";
import type { Entity, Vec3 } from "@3dverse/livelink";
import { DOM3DAnchor, ViewportContext } from "@3dverse/livelink-react";
import { cn } from "./cn";
import type { Point, Quad, QuadPoint } from "@/content/type";
import { quadToMatrix3d } from "./trash";

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
    containerClassName,
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
    containerClassName?: string;
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
            <DOM3DAnchor worldPosition={[0, 0, 0]} onProjectionChange={handleProjectionChange}>
                <span />
            </DOM3DAnchor>
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
                    <div className={cn("absolute left-0 top-0 w-full h-full", containerClassName)}>
                        {debug && <DebugQuadrant quadrant="center" />}
                        {center}
                    </div>
                )}

                {(left || debug) && (
                    <div
                        className={cn("absolute flex justify-end", containerClassName)}
                        style={{ left: -outskirt, top: 0, width: outskirt, height: baseH }}
                    >
                        {debug && <DebugQuadrant quadrant="left" />}
                        {left}
                    </div>
                )}

                {(top || debug) && (
                    <div
                        className={cn("absolute flex justify-end items-end", containerClassName)}
                        style={{ left: 0, top: -outskirt, width: baseW, height: outskirt }}
                    >
                        {debug && <DebugQuadrant quadrant="top" />}
                        {top}
                    </div>
                )}

                {(right || debug) && (
                    <div
                        className={cn("absolute", containerClassName)}
                        style={{ left: baseW, top: 0, width: outskirt, height: baseH }}
                    >
                        {debug && <DebugQuadrant quadrant="right" />}
                        {right}
                    </div>
                )}

                {(bottom || debug) && (
                    <div
                        className={cn("absolute", containerClassName)}
                        style={{ left: 0, top: baseH, width: baseW, height: outskirt }}
                    >
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
