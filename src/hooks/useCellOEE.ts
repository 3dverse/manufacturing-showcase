import { useMemo } from "react";

import { useTimelineStore } from "@/store/useTimelineStore";
import { computeOEE, plannedIntervalsFromOps, qualityFromOps } from "@/core/oee";
import type { CellNode } from "@/content/type";

export function useCellOEE(cell: CellNode): number | null {
    const span = useTimelineStore((s) => s.span);
    const asOf = useTimelineStore((s) => s.asOf);
    const present = useTimelineStore((s) => s.present);

    return useMemo(() => {
        if (!span) return null;

        const targetAsOf = asOf ?? present;
        const windowStart = targetAsOf - 7 * 86400;

        const ops = (span.operationsByWorkCenter.get(cell.hash) ?? []).flatMap((id) => {
            const op = span.operations.get(id);
            return op ? [op] : [];
        });

        const dtIds = span.downtimeByWorkCenter.get(cell.hash) ?? [];
        const downtimes = dtIds.flatMap((id) => {
            const dt = span.downtimeEvents.get(id);
            return dt ? [dt] : [];
        });

        const woIds = [
            ...(span.workOrdersByLocation.get(cell.hash) ?? []),
            ...cell.machines.flatMap((m) => span.workOrdersByAsset.get(m.hash) ?? []),
        ];
        const workOrders = [...new Set(woIds)].flatMap((id) => {
            const wo = span.eamWorkOrders.get(id);
            return wo ? [wo] : [];
        });

        return computeOEE(
            plannedIntervalsFromOps(ops, windowStart, targetAsOf),
            qualityFromOps(ops, windowStart, targetAsOf),
            downtimes,
            workOrders,
            windowStart,
            targetAsOf,
        );
    }, [span, asOf, present, cell]);
}
