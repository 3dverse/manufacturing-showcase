//------------------------------------------------------------------------------
import { useMemo } from "react";

//------------------------------------------------------------------------------
import { useTimelineStore } from "@/store/useTimelineStore";
import { bucketsToDaily } from "@/hooks/useOEEHistory";

//------------------------------------------------------------------------------
import type { CellNode } from "@/content/type";

//------------------------------------------------------------------------------
export type CellKpiData = {
    /** Overall Equipment Effectiveness (0–100). */
    oee: number;
    /** Scrap rate (0–100 %). */
    scrapRate: number;
    /** Unit production cost (currency). */
    unitProductionCost: number;
    /** On-Time Delivery (0–100 %). */
    otd: number;
    /** Mean Time Between Failures (hours). */
    mtbfHours: number;
    /** Mean Time To Repair (minutes). */
    mttrMinutes: number;
    /** Daily OEE values for sparkline, ending at asOf (last 14 days). */
    oeeHistory: number[];
    /** Last 7 days scrap rate for sparkline. */
    scrapRateHistory: number[];
};

//------------------------------------------------------------------------------
const SPARKLINE_DAYS = 14;

//------------------------------------------------------------------------------
export function useCellKpis(cell: CellNode): CellKpiData {
    const span = useTimelineStore((s) => s.span);
    const asOf = useTimelineStore((s) => s.asOf);
    const present = useTimelineStore((s) => s.present);

    const cutoff = asOf ?? present;
    const windowStart = cutoff - SPARKLINE_DAYS * 24 * 3600;

    //--------------------------------------------------------------------------
    const oeeHistory = useMemo(() => {
        const buckets = span?.oeeByWorkCenter.get(cell.hash) ?? [];
        const inWindow = buckets.filter((b) => b.shiftStart >= windowStart && b.shiftEnd <= cutoff);
        return bucketsToDaily(inWindow);
    }, [span, cell.hash, windowStart, cutoff]);

    //--------------------------------------------------------------------------
    // Deterministic mock for KPIs without real data yet
    return useMemo(() => {
        const seed = cell.hash.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const r = (min: number, max: number, s = 0) => {
            const x = Math.sin((seed + s) * 12.989) * 43758.5453;
            return min + (x - Math.floor(x)) * (max - min);
        };
        const oee = oeeHistory.length ? oeeHistory[oeeHistory.length - 1] : Math.round(70 + r(0, 22, 1));
        const scrapRate = Math.round((1 + r(0, 4, 2)) * 10) / 10;
        const scrapRateHistory = Array.from({ length: 7 }, (_, i) =>
            Math.min(6, Math.max(0.5, scrapRate + Math.cos((seed + i) * 0.5) * 1.2)),
        );
        return {
            oee,
            scrapRate,
            unitProductionCost: Math.round((80 + r(0, 40, 3)) * 10) / 10,
            otd: Math.round(85 + r(0, 14, 4)),
            mtbfHours: Math.round(120 + r(0, 180, 5)),
            mttrMinutes: Math.round(15 + r(0, 45, 6)),
            oeeHistory,
            scrapRateHistory,
        };
    }, [cell.hash, oeeHistory]);
}
