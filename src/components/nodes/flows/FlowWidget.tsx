import { useCallback, useContext, useMemo, useState } from "react";
import type { Entity, Vec3 } from "@3dverse/livelink";
import { DOM3DElement, ViewportContext } from "@3dverse/livelink-react";
import { quadToMatrix3d } from "@/utils/QuadLayout";
import type { QuadPoint } from "@/utils/QuadLayout";
import { cn } from "@/utils/cn";
import type { FlowPair } from "@/content/type";

//------------------------------------------------------------------------------
const LINE_THICKNESS = 6;
const STRIPE_WIDTH = 12;

function getEntityCenter(entity: Entity): Vec3 {
    const min = entity.global_aabb.min;
    const max = entity.global_aabb.max;
    return [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
}

type Point2 = { x: number; y: number };

/** Build smooth cubic Bezier path through points (Catmull-Rom style). */
function buildSmoothPath(points: Point2[]): string {
    if (points.length < 2) return "";
    if (points.length === 2) {
        return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
    }
    const d: string[] = [`M ${points[0].x} ${points[0].y}`];
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(points.length - 1, i + 2)];
        const cp1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
        const cp2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
        d.push(`C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${p2.x} ${p2.y}`);
    }
    return d.join(" ");
}

//------------------------------------------------------------------------------
export function FlowWidget({ pair, className }: { pair: FlowPair; className?: string }) {
    const { viewport } = useContext(ViewportContext);
    const [, setProjectionTick] = useState(0);
    const handleProjectionChange = useCallback(() => {
        setProjectionTick((tick) => tick + 1);
    }, []);

    const worldFrom = useMemo(() => getEntityCenter(pair.in.entity), [pair.in.entity]);
    const worldTo = useMemo(() => getEntityCenter(pair.out.entity), [pair.out.entity]);

    // Project on every render (like QuadLayout): viewport ref is stable but camera_projection
    // updates when camera moves; only re-renders from onProjectionChange give us fresh coords.
    const hasSpline = pair.spline != null && pair.spline.length >= 2;

    const projected =
        viewport && viewport.camera_projection
            ? hasSpline
                ? {
                      kind: "spline" as const,
                      points: pair.spline!.map(({ position }) =>
                          viewport.projectWorldToScreen({ world_position: position }),
                      ),
                  }
                : {
                      kind: "line" as const,
                      from: viewport.projectWorldToScreen({ world_position: worldFrom }),
                      to: viewport.projectWorldToScreen({ world_position: worldTo }),
                  }
            : null;

    // Spline: build curved path and bounds
    const splineState =
        projected?.kind === "spline" && projected.points.length >= 2
            ? (() => {
                  const pts = projected.points.map(([x, y]) => ({ x, y }));
                  const padding = LINE_THICKNESS;
                  const minX = Math.min(...pts.map((p) => p.x)) - padding;
                  const minY = Math.min(...pts.map((p) => p.y)) - padding;
                  const maxX = Math.max(...pts.map((p) => p.x)) + padding;
                  const maxY = Math.max(...pts.map((p) => p.y)) + padding;
                  const w = maxX - minX;
                  const h = maxY - minY;
                  const pathD = buildSmoothPath(pts.map((p) => ({ x: p.x - minX, y: p.y - minY })));
                  return { pathD, minX, minY, w, h };
              })()
            : null;

    // Line: quad in screen space for quadToMatrix3d
    const boxState =
        projected?.kind === "line" && projected != null
            ? (() => {
                  const [x1, y1] = projected.from;
                  const [x2, y2] = projected.to;
                  const dx = x2 - x1;
                  const dy = y2 - y1;
                  const length = Math.hypot(dx, dy);
                  if (length < 1) return null;
                  const nx = -dy / length;
                  const ny = dx / length;
                  const h = LINE_THICKNESS / 2;
                  const quad: QuadPoint = [
                      { x: x1 + nx * h, y: y1 + ny * h },
                      { x: x2 + nx * h, y: y2 + ny * h },
                      { x: x2 - nx * h, y: y2 - ny * h },
                      { x: x1 - nx * h, y: y1 - ny * h },
                  ];
                  const matrix = quadToMatrix3d({
                      quad,
                      dimensions: { width: length, height: LINE_THICKNESS },
                  });
                  if (!matrix) return null;
                  return { length, matrix };
              })()
            : null;

    if (splineState) {
        return (
            <>
                <DOM3DElement worldPosition={[0, 0, 0]} onProjectionChange={handleProjectionChange}>
                    <span />
                </DOM3DElement>
                <div
                    className={cn("absolute left-0 top-0 pointer-events-none", className)}
                    style={{
                        left: splineState.minX,
                        top: splineState.minY,
                        width: splineState.w,
                        height: splineState.h,
                    }}
                    aria-hidden
                >
                    <svg
                        width={splineState.w}
                        height={splineState.h}
                        viewBox={`0 0 ${splineState.w} ${splineState.h}`}
                        className="block overflow-visible"
                        style={{
                            filter: "drop-shadow(4px 24px 0px #00000006)",
                        }}
                    >
                        <path
                            d={splineState.pathD}
                            fill="none"
                            stroke="var(--color-guidance)"
                            strokeOpacity={0.8}
                            strokeWidth={LINE_THICKNESS}
                            // strokeLinecap="round"
                            // strokeLinejoin="round"
                            strokeDasharray={`${STRIPE_WIDTH} 4`}
                            style={{ animation: "flow-stripes-stroke .8s linear infinite" }}
                        />
                    </svg>
                </div>
            </>
        );
    }

    if (!projected || !boxState) return null;

    return (
        <>
            <DOM3DElement worldPosition={[0, 0, 0]} onProjectionChange={handleProjectionChange}>
                <span />
            </DOM3DElement>
            <div
                className={cn(
                    "absolute left-0 top-0 origin-top-left pointer-events-none",
                    "rounded-sm overflow-hidden",
                    className,
                )}
                style={{
                    width: boxState.length,
                    height: LINE_THICKNESS,
                    transform: boxState.matrix,
                    backgroundImage: `repeating-linear-gradient(90deg, color-mix(in oklch, var(--color-guidance) 55%, transparent) 0, color-mix(in oklch, var(--color-guidance) 55%, transparent) ${STRIPE_WIDTH / 2}px, transparent ${STRIPE_WIDTH / 2}px, transparent ${STRIPE_WIDTH}px)`,
                    backgroundSize: `${STRIPE_WIDTH}px 100%`,
                    animation: "flow-stripes 0.6s linear infinite",
                }}
                aria-hidden
            />
        </>
    );
}
