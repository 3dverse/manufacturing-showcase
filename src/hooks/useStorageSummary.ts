import { useMemo } from "react";

import { useTimelineStore } from "@/store/useTimelineStore";

export type StorageSummary = {
    isLoading: boolean;

    // Manufacturing orders
    totalMoCount: number; // active MOs at asOf (have at least one RM allocation)
    fullyAllocatedMoCount: number; // MOs where every RM allocation is status "allocated" (none partial)

    // Purchase orders
    openPoCount: number; // POs with expectedDeliveryDate >= asOf (inbound)
    overduePoCount: number; // expectedDeliveryDate < asOf, not yet received
};

const EMPTY: StorageSummary = {
    isLoading: true,
    totalMoCount: 0,
    fullyAllocatedMoCount: 0,
    openPoCount: 0,
    overduePoCount: 0,
} satisfies StorageSummary;

export function useStorageSummary(): StorageSummary {
    const span = useTimelineStore((s) => s.span);
    const asOf = useTimelineStore((s) => s.asOf);
    const home = useTimelineStore((s) => s.home);
    const targetTime = asOf || home;
    const isLoading = useTimelineStore((s) => s.isLoading);

    return useMemo(() => {
        if (!span) return EMPTY;

        // Group ALL production order allocations by MO (no time filter yet),
        // then check per-MO whether every allocation is active at asOf.
        // Track the linked SO id so we can gate on orderDate later.
        const moAllocations = new Map<string, { fullyActive: boolean; soId: string | null }>();
        for (const a of [...span.allocations.values()]) {
            if (a.demandType !== "production_order" || !a.productionOrderId) continue;
            const activeAtAsOf =
                a.allocatedAt <= targetTime &&
                (a.clearedAt === null || a.clearedAt > targetTime) &&
                a.status === "allocated";
            const existing = moAllocations.get(a.productionOrderId);
            if (existing) {
                existing.fullyActive = existing.fullyActive && activeAtAsOf;
            } else {
                moAllocations.set(a.productionOrderId, { fullyActive: activeAtAsOf, soId: a.erpSalesOrderId ?? null });
            }
        }

        // Only count MOs whose linked SO was placed before asOf,
        // and that are current or haven't started yet (not already completed).
        const plannedMos = [...moAllocations.entries()].filter(([moId, v]) => {
            if (!v.soId) return false;
            const so = span.salesOrders.get(v.soId);
            if (!so || so.orderDate > targetTime) return false;
            const mo = span.productionOrders.get(moId);
            if (!mo) return false;
            const endTime = mo.timing.actualEnd ?? mo.timing.scheduledEnd;
            return endTime >= targetTime;
        });

        const totalMoCount = plannedMos.length;
        const fullyAllocatedMoCount = plannedMos.filter(([, v]) => v.fullyActive).length;

        const purchaseOrders = [...span.purchaseOrders.values()];
        const notYetReceived = (po: (typeof purchaseOrders)[number]) =>
            po.receivedAt == null || po.receivedAt > targetTime;
        const openPos = purchaseOrders.filter(
            (po) =>
                po.orderDate <= targetTime &&
                po.expectedDeliveryDate != null &&
                po.expectedDeliveryDate >= targetTime &&
                notYetReceived(po),
        );
        const overduePos = purchaseOrders.filter(
            (po) =>
                po.orderDate <= targetTime &&
                po.expectedDeliveryDate != null &&
                po.expectedDeliveryDate < targetTime &&
                notYetReceived(po),
        );

        return {
            isLoading,
            totalMoCount,
            fullyAllocatedMoCount,
            openPoCount: openPos.length,
            overduePoCount: overduePos.length,
        };
    }, [span, targetTime, isLoading]);
}
