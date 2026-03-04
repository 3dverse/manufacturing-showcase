//------------------------------------------------------------------------------
import { useCallback, useContext } from "react";

//------------------------------------------------------------------------------
import { QuadLayout } from "@/utils/QuadLayout";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import { AreaStorageOverlay } from "@/components/nodes/areas/storage/AreaStorageOverlay";
import { ViewerToolTips } from "@/components/viewer/ViewerToolTips";
import { HoverContext } from "@/contexts/HoverContext";

//------------------------------------------------------------------------------
import { NodeTypes } from "@/content/enums";
import type { AreaNode, FactoryGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export function AreaWidget({
    area,
    selectedNode,
    onClick,
}: {
    area: AreaNode;
    selectedNode?: FactoryGraphNode;
    onClick: (node: FactoryGraphNode) => void;
}) {
    //--------------------------------------------------------------------------
    // Context
    const { setHoveredNode } = useContext(HoverContext);

    //--------------------------------------------------------------------------
    // Memos
    const isAreaSelected = selectedNode?.euid === area.euid;
    const isAreaAParentOfSelectedNode =
        selectedNode?.type === NodeTypes.cell && selectedNode?.parent?.euid === area.euid;

    //--------------------------------------------------------------------------
    // Handlers
    const onMouseEnter = useCallback(() => setHoveredNode(area), [setHoveredNode, area]);

    //--------------------------------------------------------------------------
    const onMouseLeave = useCallback(() => setHoveredNode(undefined), [setHoveredNode]);

    //--------------------------------------------------------------------------
    const clickHandler = useCallback(() => onClick?.(area), [onClick, area]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <div className="pointer-events-none">
            <ViewerToolTips />
            <QuadLayout
                entity={area.entity}
                face="bottom"
                center={
                    <div className="w-full h-full" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
                        <div
                            className={cn(
                                "w-full h-full rounded-xl border-3 border-accent/80 outline-accent-500/0 outline-40 transition-all duration-200 pointer-events-auto",
                                isAreaSelected
                                    ? "border-3 outline-80"
                                    : "bg-accent-500/05 hover:bg-accent-500/10 hover:outline-80 hover:outline-accent-500/20 hover:border-accent cursor-pointer",
                            )}
                            onClick={clickHandler}
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
                        {area.name} AREA
                    </div>
                }
            />
            {(isAreaSelected || isAreaAParentOfSelectedNode) && area.name === "storage" && (
                <AreaStorageOverlay area={area} />
            )}
        </div>
    );
}
