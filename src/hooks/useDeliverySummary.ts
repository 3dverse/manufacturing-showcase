import { useMemo } from "react";

import { useTimelineStore } from "@/store/useTimelineStore";
import type { SalesOrderEntry } from "@/core/Scope";

export type DeliverySummary = {
    isLoading: boolean;

    // Sales orders
    openOrderCount: number; // active at asOf (placed, not yet past delivery date)
    overdueCount: number; // past requestedDeliveryDate, status != "shipped"
    nextDue: SalesOrderEntry | null; // earliest requestedDeliveryDate > asOf

    // Pick tasks
    totalPickCount: number;
    completedPickCount: number;
    pendingPickUnits: number; // units on active/future tasks

    // Allocations
    totalAllocCount: number;
    partialAllocCount: number; // status = "partial" (stock not fully reserved)
    stockedOrderCount: number; // SOs with FG currently sitting in the delivery zone
};

const EMPTY: DeliverySummary = {
    isLoading: true,
    openOrderCount: 0,
    overdueCount: 0,
    nextDue: null,
    totalPickCount: 0,
    completedPickCount: 0,
    pendingPickUnits: 0,
    totalAllocCount: 0,
    partialAllocCount: 0,
    stockedOrderCount: 0,
};

export function useDeliverySummary(): DeliverySummary {
    const span = useTimelineStore((s) => s.span);
    const asOf = useTimelineStore((s) => s.asOf);
    const present = useTimelineStore((s) => s.present);
    const targetAsOf = asOf || present;
    const isLoading = useTimelineStore((s) => s.isLoading);

    return useMemo(() => {
        if (!span) return EMPTY;

        const salesOrders = [...span.salesOrders.values()];
        const pickTasks = [...span.pickTasks.values()];
        const allocations = [...span.allocations.values()].filter((a) => a.demandType === "sales_order");

        // Sales order phases
        const activeSOs = salesOrders.filter(
            (so) => so.orderDate <= targetAsOf && so.requestedDeliveryDate >= targetAsOf,
        );
        const overdueOrders = salesOrders.filter(
            (so) => so.requestedDeliveryDate < targetAsOf && so.status !== "shipped",
        );
        const nextDue = [...activeSOs].sort((a, b) => a.requestedDeliveryDate - b.requestedDeliveryDate)[0] ?? null;

        // Pick task phases
        const completedPicks = pickTasks.filter((pt) => pt.pickedDate != null && pt.pickedDate <= targetAsOf);
        const pendingPicks = pickTasks.filter((pt) => pt.pickedDate == null || pt.pickedDate > targetAsOf);
        const pendingPickUnits = pendingPicks.reduce((s, pt) => s + pt.quantity, 0);

        // Allocations
        const partialAllocs = allocations.filter((a) => a.status === "partial");
        const stockedSoIds = new Set(
            allocations
                .filter((a) => a.allocatedAt <= targetAsOf && (a.clearedAt === null || a.clearedAt > targetAsOf))
                .map((a) => a.erpSalesOrderId)
                .filter(Boolean),
        );

        return {
            isLoading,
            openOrderCount: activeSOs.length,
            overdueCount: overdueOrders.length,
            nextDue,
            totalPickCount: pickTasks.length,
            completedPickCount: completedPicks.length,
            pendingPickUnits,
            totalAllocCount: allocations.length,
            partialAllocCount: partialAllocs.length,
            stockedOrderCount: stockedSoIds.size,
        };
    }, [span, targetAsOf, isLoading]);
}
