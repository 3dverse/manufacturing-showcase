import { useMemo } from "react";
import { useTimelineStore } from "@/store/useTimelineStore";
import type { AsOfSnapshot } from "@/core/Scope";

/** Raw span flattened to arrays — stable, only changes when span data changes. */
export function useSpanSnapshot(): AsOfSnapshot | null {
    const span = useTimelineStore((s) => s.span);
    return useMemo(() => {
        if (!span) return null;
        return {
            level: "factory",
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
    }, [span]);
}
