import { useMemo } from "react";

import { computeOEE, mergeIntervals, clipIntervalsToWindow, poMetricsForWindow } from "@/core/oee";
import type { TimelineSpan } from "@/core/Scope";

export function useFactoryOEE(span: TimelineSpan | null, targetAsOf: number): number | null {
    // Span-stable: pre-merge all PO intervals once when the span loads.
    // Runs only when span changes, not on every tick.
    const mergedPoIntervals = useMemo(() => {
        if (!span) return null;
        const byStart = [...span.productionOrders.values()].sort(
            (a, b) =>
                (a.timing.actualStart ?? a.timing.scheduledStart) - (b.timing.actualStart ?? b.timing.scheduledStart),
        );
        return mergeIntervals(
            byStart.map((po) => [
                po.timing.actualStart ?? po.timing.scheduledStart,
                po.timing.actualEnd ?? po.timing.scheduledEnd,
            ]),
        );
    }, [span]);

    // Per-minute: clip pre-merged intervals to window, compute quality, run OEE.
    const minuteAsOf = Math.floor(targetAsOf / 60) * 60;
    return useMemo(() => {
        if (!span || !mergedPoIntervals) return null;
        const windowStart = minuteAsOf - 7 * 86400;
        const plannedIntervals = clipIntervalsToWindow(mergedPoIntervals, windowStart, minuteAsOf);
        const { quality, performance } = poMetricsForWindow(span.sortedProductionOrders, windowStart, minuteAsOf);
        return computeOEE(
            plannedIntervals,
            quality,
            performance,
            span.sortedDowntimes,
            span.sortedWorkOrders,
            windowStart,
            minuteAsOf,
        );
    }, [span, mergedPoIntervals, minuteAsOf]);
}
