//------------------------------------------------------------------------------
import { useCallback, useContext, useMemo } from "react";
import { BoundingBoxFaceProjection } from "@3dverse/livelink-react-ui";

//------------------------------------------------------------------------------
import { HoverContext } from "@/contexts/HoverContext";
import { SelectionContext } from "@/contexts/SelectionContext";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import { NodeTypes } from "@/content/enums";
import type { FactoryGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const NodeSummary = ({
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
    // Handlers
    const mouseEnterHandler = useCallback(() => setHoveredNode(node), [setHoveredNode, node]);

    //--------------------------------------------------------------------------
    const mouseLeaveHandler = useCallback(() => setHoveredNode(undefined), [setHoveredNode]);

    //--------------------------------------------------------------------------
    const mouseClickHandler = useCallback(() => onClick?.(node), [onClick, node]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <BoundingBoxFaceProjection
            entity={node.entity}
            face="right"
            className="flex items-end pb-4"
            style={{
                display: isSelected ? "none" : undefined,
            }}
        >
            <div
                className={cn(
                    "group w-full h-48 p-2 border-2 rounded-xl border-slate-0 transition-colors duration-200",
                    isSelected ? "" : "hover:bg-slate-0/20 hover:border-accent cursor-pointer",
                )}
                onClick={mouseClickHandler}
                onMouseEnter={mouseEnterHandler}
                onMouseLeave={mouseLeaveHandler}
            >
                <p className="px-3 py-1 w-fit text-slate-800 text-base capitalize bg-slate-0/50 border border-slate-0/50 group-hover:bg-accent group-hover:text-slate-0 group-hover:border-accent-600 rounded-lg backdrop-blur-sm">
                    {node.name} {node.type === NodeTypes.line && "LINE"}
                </p>
            </div>
        </BoundingBoxFaceProjection>
    );
};
