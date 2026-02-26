//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";

//------------------------------------------------------------------------------
import { QuadLayout } from "@/utils/QuadLayout";

//------------------------------------------------------------------------------
import type { AreaNode } from "@/content/type";

//------------------------------------------------------------------------------
export function AreaStoragePanel({ area }: { area: AreaNode }) {
    //--------------------------------------------------------------------------
    return (
        <>
            <QuadLayout
                entity={area.entity}
                face="top"
                center={
                    <div className="flex flex-col justify-end items-end w-full h-full scale-[-1_1]">
                        <ViewerPanel className="w-fit px-8 py-4 rounded-lg shadow-none">
                            <p className="text-accent text-lg">{area.name} AREA</p>
                            {/* {area.name} */}
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
        </>
    );
}
