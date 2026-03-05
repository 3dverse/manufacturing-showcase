import { useCallback, useContext, useMemo } from "react";

//------------------------------------------------------------------------------
import { HoverContext } from "@/contexts/HoverContext";
import { SelectionContext } from "@/contexts/SelectionContext";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";
import { QuadLayout } from "@/utils/QuadLayout";

//------------------------------------------------------------------------------
import type { FactoryGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
export const FloorOutline = ({
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
        <QuadLayout
            entity={node.entity}
            face="bottom"
            center={
                <div className="w-full h-full" onMouseEnter={mouseEnterHandler} onMouseLeave={mouseLeaveHandler}>
                    <div
                        className={cn(
                            "w-full h-full rounded-xl border-3 border-accent/80 outline-accent-500/0 outline-40 transition-all duration-200 pointer-events-auto",
                            isSelected ? "border-3 outline-80" : ["bg-accent-500/05"],
                            isHoverable
                                ? "hover:bg-accent-500/10 hover:outline-80 hover:outline-accent-500/20 hover:border-accent cursor-pointer"
                                : "pointer-events-none",
                        )}
                        onClick={mouseClickHandler}
                    />
                </div>
            }
            right={
                <div
                    className="w-full h-full p-4 text-accent text-center uppercase"
                    style={{
                        textOrientation: "mixed",
                        writingMode: "sideways-lr",
                    }}
                >
                    {node.name} {node.type}
                </div>
            }
        />
    );
};
