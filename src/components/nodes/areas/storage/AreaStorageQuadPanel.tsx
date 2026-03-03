//------------------------------------------------------------------------------
import { useMemo } from "react";

//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { PanelTitle, PanelWrapper, PanelShadow, PanelAnchorLine } from "@/components/common/panel";
import { AreaStorageKpiCharts } from "@/components/nodes/areas/storage/AreaStorageKpiCharts";
import type { AreaStorageKpiData } from "@/components/nodes/areas/storage/AreaStorageKpiCharts";

//------------------------------------------------------------------------------
import { QuadLayout } from "@/utils/QuadLayout";

//------------------------------------------------------------------------------
import type { AreaNode } from "@/content/type";

//------------------------------------------------------------------------------
/** Deterministic mock KPI data per area (replace with real API when available). */
function useAreaStorageKpiData(area: AreaNode): AreaStorageKpiData {
    return useMemo(() => {
        const seed = area.euid.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const periods = 6;
        const now = new Date();
        const monthAgo = (i: number) => {
            const d = new Date(now);
            d.setMonth(d.getMonth() - (periods - 1 - i));
            return d;
        };
        const occupancyBase = 50 + (seed % 45);
        const densityBase = 45 + (seed % 40);
        const occupancyRateByTime = Array.from({ length: periods }, (_, i) => ({
            date: monthAgo(i),
            value: Math.min(100, Math.max(0, occupancyBase + Math.sin((seed + i) * 0.5) * 12)),
        }));
        const storageDensityByTime = Array.from({ length: periods }, (_, i) => ({
            date: monthAgo(i),
            value: Math.min(100, Math.max(0, densityBase + Math.cos((seed + i) * 0.4) * 10)),
        }));
        const inventoryTurnoverByTime = Array.from({ length: periods }, (_, i) => ({
            date: monthAgo(i),
            value: Math.max(0.3, 1.2 + Math.sin((seed + i) * 0.7) * 0.6 + (i / periods) * 0.4),
        }));
        return {
            occupancyRateByTime,
            storageDensityByTime,
            inventoryTurnoverByTime,
        };
    }, [area.euid]);
}

//------------------------------------------------------------------------------
export function AreaStorageQuadPanel({ area }: { area: AreaNode }) {
    //--------------------------------------------------------------------------
    const kpiData = useAreaStorageKpiData(area);

    //--------------------------------------------------------------------------
    return (
        <>
            <QuadLayout
                entity={area.entity}
                face="right"
                center={
                    <div className="relative flex flex-col justify-end items-start w-fit h-full">
                        <PanelShadow />
                        <ViewerPanel
                            className="flex flex-col gap-4 w-fit mb-1 text-base rounded-xl shadow-none [outline:2px_solid_#ffffff90] outline-offset-3 pointer-events-auto"
                            style={{
                                cornerShape: "bevel",
                            }}
                        >
                            <PanelWrapper className="py-4">
                                <PanelTitle>{area.name} AREA</PanelTitle>
                                <AreaStorageKpiCharts data={kpiData} />
                            </PanelWrapper>
                        </ViewerPanel>
                        <PanelAnchorLine />
                    </div>
                }
                className="pointer-events-none"
            />
            {/* <QuadLayout
                entity={area.entity}
                face="front"
                right={
                    <div className="w-[3px] bg-slate-0 h-[calc(100%-8px)] -translate-x-16 translate-y-2 rounded-sm" />
                }
                className="pointer-events-none"
            /> */}
        </>
    );
}
