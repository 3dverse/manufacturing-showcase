import { useCallback, useContext } from "react";

//------------------------------------------------------------------------------
import { QuadLayout } from "@/utils/QuadLayout";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import { HoverContext } from "@/contexts/HoverContext";

//------------------------------------------------------------------------------
import type { LineNode, FactoryGraphNode, CellNode } from "@/content/type";
import { NodeTypes } from "@/content/enums";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export function AreaChildWidget({
    node,
    selectedNode,
    onClick,
}: {
    node: LineNode | CellNode;
    selectedNode?: FactoryGraphNode;
    onClick: (node: FactoryGraphNode) => void;
}) {
    //--------------------------------------------------------------------------
    // Context
    const { setHoveredNode } = useContext(HoverContext);

    //--------------------------------------------------------------------------
    // Memos
    const isLineSelected = selectedNode?.euid === node.euid;

    //--------------------------------------------------------------------------
    // Handlers
    const onMouseEnter = useCallback(() => setHoveredNode(node), [setHoveredNode, node]);

    //--------------------------------------------------------------------------
    const onMouseLeave = useCallback(() => setHoveredNode(undefined), [setHoveredNode]);

    //--------------------------------------------------------------------------
    const clickHandler = useCallback(() => onClick?.(node), [onClick, node]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <>
            <QuadLayout
                entity={node.entity}
                face="bottom"
                center={
                    <div
                        className={cn(
                            "w-full h-full rounded-xl transition-colors duration-200",
                            isLineSelected ? "border-8 border-accent-500" : "hover:bg-slate-0/20 cursor-pointer",
                        )}
                        onClick={clickHandler}
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                    />
                }
            />
            <QuadLayout
                entity={node.entity}
                face="right"
                center={
                    <div
                        className={cn(
                            "w-full h-60 p-2 border-2 rounded-xl border-slate-0 transition-colors duration-200",
                            isLineSelected ? "opacity-0" : "hover:bg-slate-0/20 hover:border-accent cursor-pointer",
                        )}
                        onClick={clickHandler}
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                    >
                        <p className="px-3 py-1 w-fit text-slate-800 text-base capitalize bg-slate-0/50 border border-slate-0/50 rounded-lg backdrop-blur-sm">
                            {node.name} {node.type === NodeTypes.line && "LINE"}
                        </p>
                    </div>
                }
                containerClassName="flex items-end"
            />
        </>
    );
}
