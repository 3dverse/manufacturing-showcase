import { useCallback, useContext, useMemo, useState } from "react";
import type { Entity, Vec3 } from "@3dverse/livelink";
import { DOM3DElement, ViewportContext } from "@3dverse/livelink-react";
import { cn } from "@/utils/cn";
import type { FlowInNode, FlowOutNode } from "@/content/type";

//------------------------------------------------------------------------------
const LINE_THICKNESS = 8;

function getEntityCenter(entity: Entity): Vec3 {
    const min = entity.global_aabb.min;
    const max = entity.global_aabb.max;
    return [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
}

//------------------------------------------------------------------------------
export function FlowWidget({ pair, className }: { pair: { in: FlowInNode; out: FlowOutNode }; className?: string }) {
    const { viewport } = useContext(ViewportContext);
    const [, setProjectionTick] = useState(0);
    const handleProjectionChange = useCallback(() => {
        setProjectionTick((tick) => tick + 1);
    }, []);

    const worldFrom = useMemo(() => getEntityCenter(pair.in.entity), [pair.in.entity]);
    const worldTo = useMemo(() => getEntityCenter(pair.out.entity), [pair.out.entity]);

    // Project on every render (like QuadLayout): viewport ref is stable but camera_projection
    // updates when camera moves; only re-renders from onProjectionChange give us fresh coords.
    const projected =
        viewport && viewport.camera_projection
            ? {
                  from: viewport.projectWorldToScreen({ world_position: worldFrom }),
                  to: viewport.projectWorldToScreen({ world_position: worldTo }),
              }
            : null;

    // Rectangle band between from and to: 4 corners in screen space (quad)
    const quad =
        projected != null
            ? (() => {
                  const [x1, y1] = projected.from;
                  const [x2, y2] = projected.to;
                  const dx = x2 - x1;
                  const dy = y2 - y1;
                  const len = Math.hypot(dx, dy);
                  if (len < 1) return null;
                  const nx = -dy / len;
                  const ny = dx / len;
                  const h = LINE_THICKNESS / 2;
                  return {
                      points: [
                          [x1 + nx * h, y1 + ny * h],
                          [x1 - nx * h, y1 - ny * h],
                          [x2 - nx * h, y2 - ny * h],
                          [x2 + nx * h, y2 + ny * h],
                      ] as [number, number][],
                      bounds: {
                          minX: Math.min(x1, x2) - h,
                          minY: Math.min(y1, y2) - h,
                          maxX: Math.max(x1, x2) + h,
                          maxY: Math.max(y1, y2) + h,
                      },
                  };
              })()
            : null;

    if (!projected || !quad) return null;

    const w = quad.bounds.maxX - quad.bounds.minX;
    const h = quad.bounds.maxY - quad.bounds.minY;
    const polygonPoints = quad.points
        .map(([x, y]) => `${x - quad.bounds.minX},${y - quad.bounds.minY}`)
        .join(" ");

    return (
        <>
            {/* Fixed position so we always receive projection updates when camera moves (like QuadLayout). */}
            <DOM3DElement worldPosition={[0, 0, 0]} onProjectionChange={handleProjectionChange}>
                <span />
            </DOM3DElement>
            <div
                className="absolute pointer-events-none overflow-visible"
                style={{
                    left: quad.bounds.minX,
                    top: quad.bounds.minY,
                    width: w,
                    height: h,
                }}
                aria-hidden
            >
                <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
                    <polygon
                        points={polygonPoints}
                        className={cn(
                            "fill-accent/40 transition-colors duration-200",
                            className,
                        )}
                    />
                </svg>
            </div>
        </>
    );
}
