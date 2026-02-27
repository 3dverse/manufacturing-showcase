//------------------------------------------------------------------------------
import { AreaStorageWidget } from "@/components/viewer/areas/storage/AreaStorageWidget";
import { AreaStoragePanel } from "@/components/viewer/areas/storage/AreaStoragePanel";

//------------------------------------------------------------------------------
import { QuadLayout } from "@/utils/QuadLayout";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { AreaNode } from "@/content/type";

//------------------------------------------------------------------------------
export function AreaWidget({
    area,
    isSelected = false,
    onClick,
}: {
    area: AreaNode;
    isSelected?: boolean;
    onClick?: () => void;
}) {
    return (
        <div className="pointer-events-none">
            <QuadLayout
                entity={area.entity}
                face="bottom"
                center={
                    <div
                        className={cn(
                            "w-full h-full cursor-pointer rounded-xl border-white/40 outline-accent-500/20 transition-colors duration-200 pointer-events-auto",
                            isSelected
                                ? "border-3 outline-100"
                                : "hover:border-3 hover:outline-100 bg-accent-500/10 hover:bg-accent-500/20",
                        )}
                        onClick={onClick}
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

            {isSelected && area.name === "storage" && (
                <>
                    <AreaStorageWidget area={area} />
                    <AreaStoragePanel area={area} />
                </>
            )}
        </div>
    );
}
