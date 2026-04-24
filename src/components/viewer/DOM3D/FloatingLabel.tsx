import { BoundingBoxFaceProjection } from "@3dverse/livelink-react-ui";

//------------------------------------------------------------------------------
import { useNavNode } from "@/components/navigation/hooks";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { SceneGraphNode } from "@/content/type";
import { useMemo } from "react";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const FloatingLabel = ({ node }: { node: SceneGraphNode }) => {
    //--------------------------------------------------------------------------
    // Hooks
    const { pointerDownHandler, clickHandler, mouseEnterHandler, mouseLeaveHandler, isSelected, isHovered } =
        useNavNode(node, "dom3d");

    //--------------------------------------------------------------------------
    // Memos
    const stateClassName = useMemo(() => {
        return isSelected ? "opacity-0 pointer-events-none!" : "pointer-events-auto cursor-pointer";
    }, [isSelected]);

    //--------------------------------------------------------------------------
    const pStateClassName = useMemo(() => {
        return isHovered ? "bg-slate-0/70 text-accent-600 scale-110" : "";
    }, [isHovered]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <BoundingBoxFaceProjection entity={node.entity} face="right" className="transform-3d pointer-events-none!">
            <div
                className={cn("transform-3d transition-colors duration-200", stateClassName)}
                onPointerDown={pointerDownHandler}
                onClick={clickHandler}
                onMouseEnter={mouseEnterHandler}
                onMouseLeave={mouseLeaveHandler}
            >
                <p
                    className={cn(
                        "px-3 py-1 w-fit text-base capitalize text-slate-0 bg-accent-600/90 border border-slate-0/50 rounded-full backdrop-blur-sm transition-all duration-200",
                        pStateClassName,
                    )}
                >
                    {node.name}
                </p>
            </div>
        </BoundingBoxFaceProjection>
    );
};
