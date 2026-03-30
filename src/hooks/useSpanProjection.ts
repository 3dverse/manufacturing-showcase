import { useMemo } from "react";
import { useTimelineStore } from "@/store/useTimelineStore";
import { projectSnapshot, type AsOfProjection } from "@/core/Projection";
import type { AsOfSnapshot } from "@/core/Scope";

/**
 * Projects ALL entities in the accumulated span — no scope filtering, no asOf
 * time-window filtering — so that the correlation index can traverse relationships
 * across areas and time boundaries.
 *
 * Phase/progress values are still computed relative to asOf (for display), but
 * every entity the span has ever fetched is included regardless of its node scope.
 */
export function useSpanProjection(): AsOfProjection | null {
    const span = useTimelineStore((s) => s.span);
    const asOf = useTimelineStore((s) => s.asOf);

    return useMemo(() => {
        if (!span) return null;

        const snapshot: AsOfSnapshot = {
            level: "factory", // not used by correlation — satisfies the type
            salesOrders: [...span.salesOrders.values()],
            productionOrders: [...span.productionOrders.values()],
            operations: [...span.operations.values()],
            downtimeEvents: [...span.downtimeEvents.values()],
            eamWorkOrders: [...span.eamWorkOrders.values()],
            pickTasks: [...span.pickTasks.values()],
            receipts: [...span.receipts.values()],
            putawayTasks: [...span.putawayTasks.values()],
            purchaseOrders: [...span.purchaseOrders.values()],
            allocations: [...span.allocations.values()],
        };

        return projectSnapshot(snapshot, asOf);
    }, [span, asOf]);
}
