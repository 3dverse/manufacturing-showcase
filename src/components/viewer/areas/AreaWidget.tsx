//------------------------------------------------------------------------------
import { useEffect, useRef, useState } from "react";

//------------------------------------------------------------------------------
import { AreaStorageOverlay } from "@/components/viewer/areas/storage/AreaStorageOverlay";
import { AreaStorageQuadPanel } from "@/components/viewer/areas/storage/AreaStorageQuadPanel";
import { AreaProductionQuadPanel } from "@/components/viewer/areas/production/AreaProductionQuadPanel";
import { CellWidget } from "@/components/viewer/cells/CellWidget";

//------------------------------------------------------------------------------
import { QuadLayout } from "@/utils/QuadLayout";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { AreaNode, CellNode, FactoryGraphNode } from "@/content/type";

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
    const tooltipRef = useRef<HTMLDivElement>(null);
    const frame = useRef<number | null>(null);
    const [isTooltipVisible, setIsTooltipVisible] = useState<boolean>(false);
    const [tooltipCellContent, setTooltipCellContent] = useState<{ cell?: CellNode } | null>(null);

    //--------------------------------------------------------------------------
    const isAreaSelected = selectedNode?.euid === area.euid;
    // TODO: Implement this
    const isAreaAParentOfSelectedNode = isAreaSelected;

    //--------------------------------------------------------------------------
    const updatePosition = (e: React.MouseEvent<HTMLDivElement>) => {
        if (frame.current) return;

        frame.current = requestAnimationFrame(() => {
            if (tooltipRef.current) {
                tooltipRef.current.style.transform = `translate(${e.clientX + 12}px, ${e.clientY + 12}px)`;
            }
            frame.current = null;
        });
    };

    //--------------------------------------------------------------------------
    useEffect(() => {
        return () => cancelAnimationFrame(frame.current as number);
    }, []);

    // Hide tooltip when selected node changes
    useEffect(() => {
        setIsTooltipVisible(false);
    }, [selectedNode]);

    //--------------------------------------------------------------------------
    return (
        <div className="pointer-events-none">
            {isTooltipVisible && (
                <div
                    ref={tooltipRef}
                    className="
                        fixed top-0 left-0 z-50
                        px-2 py-1
                        text-white bg-accent
                        rounded-sm shadow-lg
                        transition-opacity duration-150
                        pointer-events-none
                    "
                >
                    <p className="text-xs uppercase tracking-wide">{area.name} AREA</p>
                    {tooltipCellContent && (
                        <p className="text-xs capitalize opacity-80">{tooltipCellContent.cell?.name}</p>
                    )}
                </div>
            )}
            <QuadLayout
                entity={area.entity}
                face="bottom"
                center={
                    <div
                        className="w-full h-full"
                        onMouseEnter={() => !isAreaSelected && setIsTooltipVisible(true)}
                        onMouseLeave={() => setIsTooltipVisible(false)}
                        onMouseMoveCapture={(e) => !isAreaSelected && updatePosition(e)}
                    >
                        <div
                            className={cn(
                                "w-full h-full cursor-pointer rounded-xl border-white/40 outline-accent-500/20 transition-colors duration-200 pointer-events-auto",
                                isAreaSelected
                                    ? "border-3 outline-100 hover:outline-accent/30"
                                    : "hover:border-3 hover:outline-100 bg-accent-500/10 hover:bg-accent-500/20",
                            )}
                            onClick={() => onClick(area)}
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

            {area.cells.length > 0 &&
                area.cells.map((cell) => {
                    const isCellSelected = selectedNode?.euid === cell.euid;
                    return (
                        <CellWidget
                            key={cell.euid}
                            cell={cell}
                            isSelected={isCellSelected}
                            onMouseEnter={() => {
                                if (!isCellSelected) {
                                    setIsTooltipVisible(true);
                                    setTooltipCellContent({ cell });
                                }
                            }}
                            onMouseLeave={() => {
                                setIsTooltipVisible(false);
                                setTooltipCellContent(null);
                            }}
                            onMouseMoveCapture={(e) => !isCellSelected && updatePosition(e)}
                            onClick={() => onClick(cell)}
                        />
                    );
                })}

            {(isAreaSelected || isAreaAParentOfSelectedNode) && area.name === "storage" && (
                <>
                    <AreaStorageOverlay area={area} />
                    <AreaStorageQuadPanel area={area} />
                </>
            )}

            {(isAreaSelected || isAreaAParentOfSelectedNode) && area.name === "production" && (
                <>
                    <AreaProductionQuadPanel area={area} />
                </>
            )}
        </div>
    );
}
