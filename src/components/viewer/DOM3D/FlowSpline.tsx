import { useCallback, useContext, useMemo, useState } from "react";
import { DOM3DAnchor, ViewportContext } from "@3dverse/livelink-react";
import type { FlowNode } from "@/content/type";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
const LINE_THICKNESS = 3;
const STRIPE_WIDTH = 12;
const POINT_RADIUS = 4;

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
export function FlowSpline({ flow, className }: { flow: FlowNode; className?: string }) {
    const { viewport } = useContext(ViewportContext);
    const [, setProjectionTick] = useState(0);
    const handleProjectionChange = useCallback(() => {
        setProjectionTick((tick) => tick + 1);
    }, []);

    const splinePoints = useMemo(() => {
        const path = flow.paths.find((p) => p.length >= 2);
        return path ?? null;
    }, [flow.paths]);

    const hasSpline = splinePoints != null && splinePoints.length >= 2;

    const projected =
        viewport && viewport.camera_projection && hasSpline
            ? {
                  kind: "spline" as const,
                  points: splinePoints.map((point) => viewport.projectWorldToScreen({ world_position: point })),
              }
            : null;

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
                  const localPoints = pts.map((p) => ({ x: p.x - minX, y: p.y - minY }));
                  const pathD = buildSmoothPath(localPoints);
                  return { pathD, minX, minY, w, h, localPoints };
              })()
            : null;

    if (!splineState) return null;

    return (
        <>
            <DOM3DAnchor worldPosition={[0, 0, 0]} onProjectionChange={handleProjectionChange}>
                <span />
            </DOM3DAnchor>
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
                        strokeDasharray={`${STRIPE_WIDTH} 4`}
                        style={{ animation: "flow-stripes-stroke .8s linear infinite" }}
                    />
                    {splineState.localPoints.map((p, i) => (
                        <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r={POINT_RADIUS}
                            fill="var(--color-guidance)"
                            fillOpacity={0.9}
                        />
                    ))}
                </svg>
            </div>
        </>
    );
}
