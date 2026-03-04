import { useCallback, useContext } from "react";

//------------------------------------------------------------------------------
import { QuadLayout } from "@/utils/QuadLayout";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import { HoverContext } from "@/contexts/HoverContext";

//------------------------------------------------------------------------------
import type { CellNode, FactoryGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export function CellWidget({
    cell,
    selectedNode,
    onClick,
}: {
    cell: CellNode;
    selectedNode?: FactoryGraphNode;
    onClick: (node: FactoryGraphNode) => void;
}) {
    //--------------------------------------------------------------------------
    // Context
    const { setHoveredNode } = useContext(HoverContext);

    //--------------------------------------------------------------------------
    // Memos
    const isCellSelected = selectedNode?.euid === cell.euid;

    //--------------------------------------------------------------------------
    // Handlers
    const onMouseEnter = useCallback(() => setHoveredNode(cell), [setHoveredNode, cell]);

    //--------------------------------------------------------------------------
    const onMouseLeave = useCallback(() => setHoveredNode(undefined), [setHoveredNode]);

    //--------------------------------------------------------------------------
    const clickHandler = useCallback(() => onClick?.(cell), [onClick, cell]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <>
            <QuadLayout
                entity={cell.entity}
                face="bottom"
                center={
                    <div
                        className={cn(
                            "w-full h-full rounded-xl transition-colors duration-200",
                            isCellSelected ? "border-8 border-accent-500" : "hover:bg-slate-0/20 cursor-pointer",
                        )}
                        onClick={clickHandler}
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                    />
                }
            />
            <QuadLayout
                entity={cell.entity}
                face="right"
                center={
                    <div
                        className={cn(
                            "w-full h-full min-h-96 p-2 border-2 rounded-xl border-slate-0 transition-colors duration-200",
                            isCellSelected ? "opacity-0" : "hover:bg-slate-0/40 cursor-pointer",
                        )}
                        onClick={clickHandler}
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                    >
                        <p className="px-3 py-1 w-fit text-slate-800 text-base capitalize bg-slate-0/50 border border-slate-0/50 rounded-lg backdrop-blur-sm">
                            {cell.name}
                        </p>
                    </div>
                }
            />
        </>
    );
}
