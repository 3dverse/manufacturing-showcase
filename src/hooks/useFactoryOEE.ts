import { useMemo } from "react";

import { computeOEE, plannedIntervalsFromPOs, qualityFromPOs } from "@/core/oee";
import type { TimelineSpan } from "@/core/Scope";

export function useFactoryOEE(span: TimelineSpan | null, targetAsOf: number): number | null {
    return useMemo(() => {
        if (!span) return null;
        const windowStart = targetAsOf - 7 * 86400;
        const pos = [...span.productionOrders.values()];
        return computeOEE(
            plannedIntervalsFromPOs(pos, windowStart, targetAsOf),
            qualityFromPOs(pos, windowStart, targetAsOf),
            [...span.downtimeEvents.values()],
            [...span.eamWorkOrders.values()],
            windowStart,
            targetAsOf,
        );
    }, [span, targetAsOf]);
}
