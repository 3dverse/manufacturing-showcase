//------------------------------------------------------------------------------
import { BoundingBoxFaceProjection } from "@3dverse/livelink-react-ui";

//------------------------------------------------------------------------------
import { BadgeOEE } from "@/components/common/BadgeOEE";
import { useAreaOEE } from "@/hooks/useAreaOEE";
import { useOEEHistory } from "@/hooks/useOEEHistory";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { SceneGraphNode } from "@/content/type";
import type { ReactNode } from "react";

//------------------------------------------------------------------------------
export const TopPanel = ({
    node,
    className,
    children,
}: {
    node: SceneGraphNode;
    className?: string;
    children?: ReactNode;
}) => {
    //--------------------------------------------------------------------------
    const oee = useAreaOEE(node);
    const oeeHistory = useOEEHistory(node);

    //--------------------------------------------------------------------------
    // Render
    return (
        <BoundingBoxFaceProjection
            entity={node.entity}
            face="top"
            scale={48}
            className={cn("pointer-events-none! transform-3d", className)}
        >
            <div className="p-8 relative w-full h-full border-8 border-accent rounded-3xl pointer-events-none transform-3d">
                <span className="block absolute top-20 left-48 -translate-x-1/2 -translate-y-1/2 w-100 h-50 aspect-square bg-white rounded-full blur-[70px]" />
                <p className="relative text-accent font-semibold text-8xl capitalize">{node.name}</p>
                {/* <div className="absolute bottom-32 right-32 pl-4 flex items-baseline justify-center text-[4.5rem] text-accent font-semibold">
                    <div className="absolute bottom-[-75%] left-[-50%] w-[200%] h-[300%] bg-[white] rounded-full blur-3xl -z-10" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 radial-dashed-circle" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 aspect-square border-10 border-accent border-double rounded-full" />
                    89<span className="ml-1 text-[70%] opacity-80">%</span>
                </div> */}
                {oee !== undefined && (
                    <BadgeOEE
                        oee={oee}
                        oeeHistory={oeeHistory}
                        className="mt-8 text-[10rem] leading-35 px-10 py-8 shadow-2xl rounded-4xl backdrop-blur-lg transform-3d"
                    />
                )}
            </div>
            {children}
        </BoundingBoxFaceProjection>
    );
};
