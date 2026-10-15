import { useMemo } from "react";

import { useTimelineStore } from "@/store/useTimelineStore";
import { NodeTypes } from "@/content/enums";
import { computeOEE, poMetricsForWindow } from "@/core/oee";
import type { SceneGraphNode } from "@/content/type";

export function useAreaOEE(node: SceneGraphNode): number | undefined {
    const asOf = useTimelineStore((s) => s.asOf);
    const present = useTimelineStore((s) => s.present);
    const span = useTimelineStore((s) => s.span);

    const minuteAsOf = Math.floor((asOf || present) / 60) * 60;

    return useMemo(() => {
        if (node.type !== NodeTypes.area || node.name !== "production") return undefined;
        if (!span) return undefined;

        const windowStart = minuteAsOf - 7 * 86400;

        const wcIds = new Set([
            ...node.lines.flatMap((l) => l.cells.map((c) => c.hash)),
            ...node.cells.map((c) => c.hash),
        ]);
        const poIds = new Set(span.productionOrdersByLocation.get(node.hash) ?? []);

        const pos = span.sortedProductionOrders.filter((po) => poIds.has(po.id));
        const { intervals, quality, performance } = poMetricsForWindow(pos, windowStart, minuteAsOf);

        const downtimes = span.sortedDowntimes.filter((dt) => wcIds.has(dt.workCenterId));

        const woIds = new Set(span.workOrdersByLocation.get(node.hash) ?? []);
        const workOrders = span.sortedWorkOrders.filter((wo) => woIds.has(wo.id));

        return computeOEE(intervals, quality, performance, downtimes, workOrders, windowStart, minuteAsOf) ?? undefined;
    }, [span, node, minuteAsOf]);
}
