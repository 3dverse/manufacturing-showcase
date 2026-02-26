//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { AreaStorageWidget } from "./AreaStorageWidget";

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
                            "w-full h-full cursor-pointer rounded-xl outline-accent-500/20 transition-colors duration-200 pointer-events-auto",
                            isSelected ? "outline-100 " : "bg-accent-500/10 hover:bg-accent-500/20",
                        )}
                        onClick={onClick}
                    />
                }
                right={
                    <div
                        className="w-full h-full p-4 text-accent align-left uppercase"
                        style={{
                            textOrientation: "mixed",
                            writingMode: "sideways-lr",
                        }}
                    >
                        {area.name} AREA
                    </div>
                }
            />

            {isSelected && area.name === "storage" && <AreaStorageWidget area={area} />}

            <QuadLayout
                entity={area.entity}
                face="top"
                center={
                    <div className="flex flex-col justify-end items-end w-full h-full scale-[-1_1]">
                        <ViewerPanel className="w-fit px-8 py-4 rounded-lg shadow-none">
                            <p className="text-accent text-lg">{area.name} AREA</p>
                            {area.name}
                        </ViewerPanel>
                    </div>
                }
                className="pointer-events-none"
            />

            <QuadLayout
                entity={area.entity}
                face="right"
                left={<span className="border-r-8 border-slate-0/50 w-full h-full -translate-y-3" />}
                className="pointer-events-none"
            />
        </div>
    );
}
