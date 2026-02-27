//------------------------------------------------------------------------------
import { AreaStorageWidget } from "@/components/viewer/areas/storage/AreaStorageWidget";
import { AreaStoragePanel } from "@/components/viewer/areas/storage/AreaStoragePanel";
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

            {isAreaSelected && area.name === "storage" && (
                <>
                    <AreaStorageWidget area={area} />
                    <AreaStoragePanel area={area} />
                </>
            )}
        </div>
    );
}
