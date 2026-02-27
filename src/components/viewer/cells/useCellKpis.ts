//------------------------------------------------------------------------------
import { useMemo } from "react";

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
    /** Last 7 days OEE for sparkline. */
    oeeHistory: number[];
    /** Last 7 days scrap rate for sparkline. */
    scrapRateHistory: number[];
};

//------------------------------------------------------------------------------
/** Deterministic mock KPI data per cell (replace with real API when available). */
export function useCellKpis(cell: CellNode): CellKpiData {
    return useMemo(() => {
        const seed = cell.euid.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const r = (min: number, max: number, s = 0) => {
            const x = Math.sin((seed + s) * 12.989) * 43758.5453;
            return min + (x - Math.floor(x)) * (max - min);
        };
        const oee = Math.round(70 + r(0, 22, 1));
        const scrapRate = Math.round((1 + r(0, 4, 2)) * 10) / 10;
        const unitProductionCost = Math.round((80 + r(0, 40, 3)) * 10) / 10;
        const otd = Math.round(85 + r(0, 14, 4));
        const mtbfHours = Math.round(120 + r(0, 180, 5));
        const mttrMinutes = Math.round(15 + r(0, 45, 6));
        const oeeHistory = Array.from({ length: 7 }, (_, i) =>
            Math.min(98, Math.max(60, oee + (Math.sin((seed + i) * 0.7) * 8 + (i - 3) * 0.5))),
        );
        const scrapRateHistory = Array.from({ length: 7 }, (_, i) =>
            Math.min(6, Math.max(0.5, scrapRate + Math.cos((seed + i) * 0.5) * 1.2)),
        );
        return {
            oee,
            scrapRate,
            unitProductionCost,
            otd,
            mtbfHours,
            mttrMinutes,
            oeeHistory,
            scrapRateHistory,
        };
    }, [cell.euid]);
}
