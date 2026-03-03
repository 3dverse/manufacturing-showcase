import { useCallback, useContext, useMemo, useState } from "react";
import type { Entity, Vec3 } from "@3dverse/livelink";
import { DOM3DElement, ViewportContext } from "@3dverse/livelink-react";
import { quadToMatrix3d } from "@/utils/QuadLayout";
import type { QuadPoint } from "@/utils/QuadLayout";
import { cn } from "@/utils/cn";
import type { FlowInNode, FlowOutNode } from "@/content/type";

//------------------------------------------------------------------------------
const LINE_THICKNESS = 8;
const STRIPE_WIDTH = 12;

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

    // Quad in screen space (tl, tr, br, bl) for quadToMatrix3d; dimensions = length × thickness.
    const boxState =
        projected != null
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

    if (!projected || !boxState) return null;

    return (
        <>
            {/* Fixed position so we always receive projection updates when camera moves (like QuadLayout). */}
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
