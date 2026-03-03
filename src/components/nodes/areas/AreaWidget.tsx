//------------------------------------------------------------------------------
import { useEffect, useRef, useState } from "react";

//------------------------------------------------------------------------------
import { AreaStorageOverlay } from "@/components/nodes/areas/storage/AreaStorageOverlay";
import { AreaChildWidget } from "@/components/nodes/areas/AreaChildWidget";

//------------------------------------------------------------------------------
import { QuadLayout } from "@/utils/QuadLayout";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { AreaNode, CellNode, FactoryGraphNode, LineNode } from "@/content/type";
import { NodeTypes } from "@/content/enums";

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
    const [tooltipCellContent, setTooltipCellContent] = useState<LineNode | CellNode | null>(null);

    //--------------------------------------------------------------------------
    const isAreaSelected = selectedNode?.euid === area.euid;
    const isAreaAParentOfSelectedNode =
        selectedNode?.type === NodeTypes.cell && selectedNode?.parent?.euid === area.euid;
    const children = [...area.lines, ...area.cells];

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
                <TooltipContent node={tooltipCellContent} areaName={area.name} tooltipRef={tooltipRef} />
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
                                "w-full h-full rounded-xl border-3 border-accent/80 outline-accent-500/0 outline-40 transition-all duration-200 pointer-events-auto",
                                isAreaSelected
                                    ? "border-3 outline-80"
                                    : "bg-accent-500/05 hover:bg-accent-500/10 hover:outline-80 hover:outline-accent-500/20 hover:border-accent cursor-pointer",
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

            {children.length > 0 &&
                children.map((child) => {
                    const isChildSelected = selectedNode?.euid === child.euid;
                    return (
                        <AreaChildWidget
                            key={child.euid}
                            node={child}
                            isSelected={isChildSelected}
                            onMouseEnter={() => {
                                if (!isChildSelected) {
                                    setIsTooltipVisible(true);
                                    setTooltipCellContent(child);
                                }
                            }}
                            onMouseLeave={() => {
                                setIsTooltipVisible(false);
                                setTooltipCellContent(null);
                            }}
                            onMouseMoveCapture={(e) => !isChildSelected && updatePosition(e)}
                            onClick={() => onClick(child)}
                        />
                    );
                })}

            {(isAreaSelected || isAreaAParentOfSelectedNode) && area.name === "storage" && (
                <AreaStorageOverlay area={area} />
            )}
        </div>
    );
}

//------------------------------------------------------------------------------
const TooltipContent = ({
    node,
    areaName,
    tooltipRef,
}: {
    node: LineNode | CellNode | null;
    areaName: string;
    tooltipRef: React.RefObject<HTMLDivElement | null>;
}) => {
    return (
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
                    transform: node ? "scale(0.8)" : undefined,
                    opacity: node ? 0.8 : 1,
                }}
            >
                {areaName} AREA
            </p>
            {node && (
                <p className="text-sm leading-tight capitalize -translate-y-px opacity-100 scale-100 starting:opacity-0 starting:scale-70 transition-all origin-bottom-left duration-200">
                    {node?.name}
                </p>
            )}
        </div>
    );
};
