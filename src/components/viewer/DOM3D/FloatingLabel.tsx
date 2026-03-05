import { useCallback, useContext, useMemo } from "react";

//------------------------------------------------------------------------------
import { HoverContext } from "@/contexts/HoverContext";
import { SelectionContext } from "@/contexts/SelectionContext";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { FactoryGraphNode } from "@/content/type";
import { BoundingBoxFaceProjection } from "@3dverse/livelink-react-ui";

//------------------------------------------------------------------------------
export const FloatingLabel = ({
    node,
    onClick,
}: {
    node: FactoryGraphNode;
    onClick?: (node: FactoryGraphNode) => void;
}) => {
    //--------------------------------------------------------------------------
    // Context
    const { selectedNode } = useContext(SelectionContext);
    const { setHoveredNode } = useContext(HoverContext);

    //--------------------------------------------------------------------------
    // Memos
    const isSelected = useMemo(() => node === selectedNode, [node, selectedNode]);

    //--------------------------------------------------------------------------
    const isHoverable = useMemo(() => !isSelected, [isSelected]);

    //--------------------------------------------------------------------------
    // Handlers
    const mouseEnterHandler = useCallback(() => setHoveredNode(node), [setHoveredNode, node]);

    //--------------------------------------------------------------------------
    const mouseLeaveHandler = useCallback(() => setHoveredNode(undefined), [setHoveredNode]);

    //--------------------------------------------------------------------------
    const mouseClickHandler = useCallback(() => onClick?.(node), [onClick, node]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <BoundingBoxFaceProjection entity={node.entity} face="right">
            <div
                className={cn("transition-colors duration-200", isSelected ? "opacity-0" : "cursor-pointer")}
                onClick={mouseClickHandler}
                onMouseEnter={mouseEnterHandler}
                onMouseLeave={mouseLeaveHandler}
            >
                <p
                    className={cn(
                        "px-3 py-1 w-fit text-base capitalize text-slate-0 bg-accent-600/90 border border-slate-0/50 rounded-full backdrop-blur-sm",
                        isHoverable ? "hover:bg-slate-0/70 hover:text-accent-600 hover:scale-110 transition-all duration-200" : "",
                    )}
                >
                    {node.name}
                </p>
            </div>
        </BoundingBoxFaceProjection>
    );
};
