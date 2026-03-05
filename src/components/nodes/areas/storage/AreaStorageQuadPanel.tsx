//------------------------------------------------------------------------------
import { useMemo } from "react";

//------------------------------------------------------------------------------
import { AreaStorageKpiCharts } from "@/components/nodes/areas/storage/AreaStorageKpiCharts";
import type { AreaStorageKpiData } from "@/components/nodes/areas/storage/AreaStorageKpiCharts";

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
    return <AreaStorageKpiCharts data={kpiData} />;
}
