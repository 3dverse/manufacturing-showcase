import { useMemo } from "react";

import { useTimelineStore } from "@/store/useTimelineStore";
import { computeOEE, opMetricsForWindow } from "@/core/oee";
import type { CellNode } from "@/content/type";

export function useCellOEE(cell: CellNode): number | null {
    const span = useTimelineStore((s) => s.span);
    const asOf = useTimelineStore((s) => s.asOf);
    const present = useTimelineStore((s) => s.present);

    const machineIds = useMemo(() => new Set(cell.machines.map((m) => m.hash)), [cell]);

    const minuteAsOf = Math.floor((asOf ?? present) / 60) * 60;

    return useMemo(() => {
        if (!span) return null;

        const windowStart = minuteAsOf - 7 * 86400;

        const ops = (span.operationsByWorkCenter.get(cell.hash) ?? []).flatMap((id) => {
            const op = span.operations.get(id);
            return op ? [op] : [];
        });
        const { intervals, quality } = opMetricsForWindow(ops, windowStart, minuteAsOf);

        const downtimes = span.sortedDowntimes.filter((dt) => dt.workCenterId === cell.hash);

        const woIds = new Set([
            ...(span.workOrdersByLocation.get(cell.hash) ?? []),
            ...cell.machines.flatMap((m) => span.workOrdersByAsset.get(m.hash) ?? []),
        ]);
        const workOrders = span.sortedWorkOrders.filter((wo) => woIds.has(wo.id));

        return computeOEE(intervals, quality, downtimes, workOrders, windowStart, minuteAsOf);
    }, [span, cell, minuteAsOf, machineIds]);
}
