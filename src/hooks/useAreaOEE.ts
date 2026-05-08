import { useMemo } from "react";

import { useTimelineStore } from "@/store/useTimelineStore";
import { NodeTypes } from "@/content/enums";
import { computeOEE, plannedIntervalsFromPOs, qualityFromPOs } from "@/core/oee";
import type { SceneGraphNode } from "@/content/type";

export function useAreaOEE(node: SceneGraphNode): number | undefined {
    const asOf = useTimelineStore((s) => s.asOf);
    const present = useTimelineStore((s) => s.present);
    const span = useTimelineStore((s) => s.span);

    return useMemo(() => {
        if (node.type !== NodeTypes.area || node.name !== "production") return undefined;
        if (!span) return undefined;

        const pos = (span.productionOrdersByLocation.get(node.hash) ?? []).flatMap((id) => {
            const po = span.productionOrders.get(id);
            return po ? [po] : [];
        });

        const wcIds = [...node.lines.flatMap((l) => l.cells.map((c) => c.hash)), ...node.cells.map((c) => c.hash)];

        const dtIds = wcIds.flatMap((wcId) => span.downtimeByWorkCenter.get(wcId) ?? []);
        const downtimes = [...new Set(dtIds)].flatMap((id) => {
            const dt = span.downtimeEvents.get(id);
            return dt ? [dt] : [];
        });

        const woIds = span.workOrdersByLocation.get(node.hash) ?? [];
        const workOrders = woIds.flatMap((id) => {
            const wo = span.eamWorkOrders.get(id);
            return wo ? [wo] : [];
        });

        const targetAsOf = asOf || present;
        const windowStart = targetAsOf - 7 * 86400;
        const result = computeOEE(
            plannedIntervalsFromPOs(pos, windowStart, targetAsOf),
            qualityFromPOs(pos, windowStart, targetAsOf),
            downtimes,
            workOrders,
            windowStart,
            targetAsOf,
        );
        return result ?? undefined;
    }, [span, asOf, present, node]);
}
