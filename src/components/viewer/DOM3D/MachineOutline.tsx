//------------------------------------------------------------------------------
import { useContext, useEffect, useState } from "react";
import { ViewportContext } from "@3dverse/livelink-react";
import { BoundingBoxFaceProjection } from "@3dverse/livelink-react-ui";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { MachineNode } from "@/content/type";

//------------------------------------------------------------------------------
export function MachineOutline({ machine }: { machine: MachineNode }) {
    //--------------------------------------------------------------------------
    const { viewport } = useContext(ViewportContext);

    //--------------------------------------------------------------------------
    const [cameraRotation, setCameraRotation] = useState(0);

    //--------------------------------------------------------------------------
    useEffect(() => {
        const cameraOrientation = viewport?.camera_projection?.world_euler_orientation;
        if (!cameraOrientation) {
            return;
        }

        let frameId: number | undefined;
        let cancelled = false;
        const update = () => {
            if (cancelled) {
                return;
            }
            const cameraOrientation = viewport.camera_projection?.world_euler_orientation;
            if (!cameraOrientation) {
                return;
            }
            setCameraRotation(cameraOrientation[1]);
            frameId = requestAnimationFrame(update);
        };
        update();

        return () => {
            cancelled = true;
            if (frameId !== undefined) {
                cancelAnimationFrame(frameId);
            }
        };
    }, [viewport]);

    //--------------------------------------------------------------------------
    const hasIncident = true;

    //--------------------------------------------------------------------------
    return (
        <BoundingBoxFaceProjection
            entity={machine.entity}
            face="bottom"
            invert
            className="flex justify-center items-center transform-3d pointer-events-none"
        >
            <div
                className="relative text-8xl w-full aspect-square rounded-full min-w-100 min-h-100"
                style={{
                    maskImage: "linear-gradient(to top, transparent 30%, black 120%)",
                    rotate: `${cameraRotation.toFixed(2)}deg`,
                }}
            >
                <div className="w-full h-full border-2 border-white rounded-full">
                    <div
                        className={cn(
                            "w-full h-full border-t-12 blur-sm rounded-full animate-spin [animation-duration:1250ms] z-10 scale-110",
                            hasIncident ? "border-warning" : "border-accent",
                        )}
                    />
                </div>
            </div>
        </BoundingBoxFaceProjection>
    );
}

// Without mask
{
    /* <div className="w-full aspect-square rounded-full border-4 border-r-0 border-b-0 border-t border-l -rotate-45 border-white/50" /> */
}
