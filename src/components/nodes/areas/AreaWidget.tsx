//------------------------------------------------------------------------------
import { useEffect, useRef, useState } from "react";

//------------------------------------------------------------------------------
import { AreaStorageOverlay } from "@/components/nodes/areas/storage/AreaStorageOverlay";
import { AreaStorageQuadPanel } from "@/components/nodes/areas/storage/AreaStorageQuadPanel";
import { AreaProductionQuadPanel } from "@/components/nodes/areas/production/AreaProductionQuadPanel";
import { CellWidget } from "@/components/nodes/cells/CellWidget";

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

        if (e.clientX == 0 && e.clientY == 0) {
            return;
        }

        frame.current = requestAnimationFrame(() => {
            if (tooltipRef.current) {
                tooltipRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
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
                        fixed top-4 left-4 z-40
                        px-2 py-1
                        text-white bg-accent
                        rounded-sm shadow-lg
                        transition-opacity duration-150
                        pointer-events-none
                    "
                >
                    <p
                        className="text-xs uppercase tracking-wide transition-all duration-200 origin-top-left"
                        style={{
                            transform: tooltipCellContent ? "scale(0.8)" : undefined,
                            opacity: tooltipCellContent ? 0.8 : 1,
                        }}
                    >
                        {area.name} AREA
                    </p>
                    {tooltipCellContent && (
                        <p className="text-sm leading-tight capitalize -translate-y-px opacity-100 scale-100 starting:opacity-0 starting:scale-70 transition-all origin-bottom-left duration-200">
                            {tooltipCellContent.cell?.name}
                        </p>
                    )}
                </div>
            )}
            <QuadLayout
                entity={area.entity}
                face="bottom"
                center={
                    <div
                        className="w-full h-full"
                        onMouseEnter={(e) => {
                            if (!isAreaSelected) {
                                setIsTooltipVisible(true);
                                updatePosition(e);
                            }
                        }}
                        onMouseLeave={() => setIsTooltipVisible(false)}
                        onMouseMoveCapture={(e) => !isAreaSelected && updatePosition(e)}
                    >
                        <div
                            className={cn(
                                "w-full h-full cursor-pointer rounded-xl border-5 border-accent/80 outline-accent-500/20 transition-colors duration-200 pointer-events-auto",
                                isAreaSelected
                                    ? "border-3 outline-100 hover:outline-accent/30"
                                    : "hover:outline-100 bg-accent-500/05 hover:bg-accent-500/10",
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
