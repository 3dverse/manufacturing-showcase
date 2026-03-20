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
        if (!cameraOrientation) return;

        const update = () => {
            const cameraOrientation = viewport.camera_projection?.world_euler_orientation;
            if (!cameraOrientation) return;
            setCameraRotation(cameraOrientation[1]);
            requestAnimationFrame(update);
        };
        update();
    }, [viewport]);

    //--------------------------------------------------------------------------
    const hasIncident = true;

    //--------------------------------------------------------------------------
    return (
        <BoundingBoxFaceProjection
            entity={machine.entity}
            face="bottom"
            invert
            className="transform-3d pointer-events-none"
        >
            <div
                className="relative text-8xl w-full aspect-square rounded-full"
                style={{
                    maskImage: "linear-gradient(to top, transparent 8%, black 120%)",
                    rotate: `${cameraRotation.toFixed(2)}deg`,
                }}
            >
                <div className="w-full h-full border-4 border-white rounded-full">
                    <div
                        className={cn(
                            "w-full h-full border-t-16 blur-sm rounded-full animate-spin [animation-duration:1250ms] z-10 scale-110",
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
