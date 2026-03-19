//------------------------------------------------------------------------------
import { BoundingBoxFaceProjection } from "@3dverse/livelink-react-ui";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { NavGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
export const TopPanel = ({ node, className }: { node: NavGraphNode; className?: string }) => {
    //--------------------------------------------------------------------------
    // Render
    return (
        <BoundingBoxFaceProjection
            entity={node.entity}
            face="top"
            className={cn("pointer-events-none! flex items-end justify-end", className)}
        >
            <div className="top-0 left-0 w-full h-full border-8 border-accent rounded-3xl pointer-events-none">
                <div className="absolute bottom-32 right-32 pl-4 flex items-baseline justify-center text-[4.5rem] text-accent font-semibold">
                    <div className="absolute bottom-[-75%] left-[-50%] w-[200%] h-[300%] bg-[white] rounded-full blur-3xl -z-10" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 radial-dashed-circle" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 aspect-square border-10 border-accent border-double rounded-full" />
                    89<span className="ml-1 text-[70%] opacity-80">%</span>
                </div>
            </div>
        </BoundingBoxFaceProjection>
    );
};
