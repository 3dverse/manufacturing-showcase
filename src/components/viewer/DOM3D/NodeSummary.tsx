import { useCallback, useContext, useMemo } from "react";

//------------------------------------------------------------------------------
import { HoverContext } from "@/contexts/HoverContext";
import { SelectionContext } from "@/contexts/SelectionContext";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";
import { QuadLayout } from "@/utils/QuadLayout";

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
        <QuadLayout
            entity={node.entity}
            face="right"
            center={
                <div
                    className={cn(
                        "w-full h-60 p-2 border-2 rounded-xl border-slate-0 transition-colors duration-200",
                        isSelected ? "opacity-0" : "hover:bg-slate-0/20 hover:border-accent cursor-pointer",
                    )}
                    onClick={mouseClickHandler}
                    onMouseEnter={mouseEnterHandler}
                    onMouseLeave={mouseLeaveHandler}
                >
                    <p className="px-3 py-1 w-fit text-slate-800 text-base capitalize bg-slate-0/50 border border-slate-0/50 rounded-lg backdrop-blur-sm">
                        {node.name} {node.type === NodeTypes.line && "LINE"}
                    </p>
                </div>
            }
            containerClassName="flex items-end"
        />
    );
};
