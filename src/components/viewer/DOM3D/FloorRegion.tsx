import { useCallback, useContext, useMemo } from "react";

//------------------------------------------------------------------------------
import { HoverContext } from "@/contexts/HoverContext";
import { SelectionContext } from "@/contexts/SelectionContext";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";
import { BoundingBoxFaceProjection } from "@3dverse/livelink-react-ui";

//------------------------------------------------------------------------------
import type { FactoryGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
export const FloorRegion = ({
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
        <BoundingBoxFaceProjection entity={node.entity} face="bottom">
            <div
                className={cn(
                    "w-full h-full rounded-xl transition-colors duration-200",
                    isSelected ? "border-8 border-accent-500" : "",
                    isHoverable ? "hover:bg-slate-0/20 cursor-pointer" : "pointer-events-none",
                )}
                onClick={mouseClickHandler}
                onMouseEnter={mouseEnterHandler}
                onMouseLeave={mouseLeaveHandler}
            />
        </BoundingBoxFaceProjection>
    );
};
