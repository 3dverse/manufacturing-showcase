//------------------------------------------------------------------------------
import { useMemo } from "react";
import { BoundingBoxFaceProjection } from "@3dverse/livelink-react-ui";

//------------------------------------------------------------------------------
import { useNavNode } from "@/components/navigation/hooks";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import { NodeTypes } from "@/content/enums";
import type { NavGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const NodeSummary = ({ node }: { node: NavGraphNode }) => {
    //--------------------------------------------------------------------------
    // Hooks
    const { pointerDownHandler, clickHandler, mouseEnterHandler, mouseLeaveHandler, isSelected, isHovered } =
        useNavNode(node, "dom3d");

    //--------------------------------------------------------------------------
    // Memos
    const stateClassName = useMemo(() => {
        const classNames = [isSelected ? "pointer-events-none" : "cursor-pointer"];
        if (!isSelected && isHovered) classNames.push("bg-slate-0/20 border-accent");
        return cn(...classNames);
    }, [isSelected, isHovered]);

    //--------------------------------------------------------------------------
    const pStateClassName = useMemo(() => {
        return isHovered ? "bg-accent text-slate-0 border-accent-600" : "";
    }, [isHovered]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <BoundingBoxFaceProjection
            entity={node.entity}
            face="right"
            className="flex items-end pb-4 transform-3d"
            style={{ display: isSelected ? "none" : undefined }}
        >
            <div
                className={cn(
                    "group w-full h-48 p-2 border-2 rounded-xl border-slate-0 transition-colors duration-200 transform-3d",
                    stateClassName,
                )}
                onPointerDown={pointerDownHandler}
                onClick={clickHandler}
                onMouseEnter={mouseEnterHandler}
                onMouseLeave={mouseLeaveHandler}
            >
                <p
                    className={cn(
                        "px-3 py-1 w-fit text-slate-800 text-base capitalize bg-slate-0/50 border border-slate-0/50 rounded-lg backdrop-blur-sm transition-colors duration-200",
                        pStateClassName,
                    )}
                >
                    {node.name} {node.type === NodeTypes.line && "LINE"}
                </p>
            </div>
        </BoundingBoxFaceProjection>
    );
};
