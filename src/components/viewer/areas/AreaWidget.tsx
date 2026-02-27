//------------------------------------------------------------------------------
import { AreaStorageOverlay } from "@/components/viewer/areas/storage/AreaStorageOverlay";
import { AreaStorageQuadPanel } from "@/components/viewer/areas/storage/AreaStorageQuadPanel";
import { AreaProductionQuadPanel } from "@/components/viewer/areas/production/AreaProductionQuadPanel";
import { AreaProductionPanel } from "@/components/viewer/areas/production/AreaProductionPanel";
import { CellWidget } from "@/components/viewer/cells/CellWidget";

//------------------------------------------------------------------------------
import { QuadLayout } from "@/utils/QuadLayout";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { AreaNode, FactoryGraphNode } from "@/content/type";

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
    const isAreaSelected = selectedNode?.euid === area.euid;
    // TODO: Implement this
    const isAreaAParentOfSelectedNode = isAreaSelected;

    //--------------------------------------------------------------------------
    return (
        <div className="pointer-events-none">
            <QuadLayout
                entity={area.entity}
                face="bottom"
                center={
                    <div
                        className={cn(
                            "w-full h-full cursor-pointer rounded-xl border-white/40 outline-accent-500/20 transition-colors duration-200 pointer-events-auto",
                            isAreaSelected
                                ? "border-3 outline-100 hover:outline-accent/30"
                                : "hover:border-3 hover:outline-100 bg-accent-500/10 hover:bg-accent-500/20",
                        )}
                        onClick={() => onClick(area)}
                    />
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
                area.cells.map((cell) => (
                    <CellWidget
                        key={cell.euid}
                        cell={cell}
                        isSelected={selectedNode?.euid === cell.euid}
                        onClick={() => onClick(cell)}
                    />
                ))}

            {(isAreaSelected || isAreaAParentOfSelectedNode) && area.name === "storage" && (
                <>
                    <AreaStorageOverlay area={area} />
                    <AreaStorageQuadPanel area={area} />
                </>
            )}

            {(isAreaSelected || isAreaAParentOfSelectedNode) && area.name === "production" && (
                <>
                    <AreaProductionQuadPanel area={area} />
                    <AreaProductionPanel area={area} />
                </>
            )}
        </div>
    );
}
