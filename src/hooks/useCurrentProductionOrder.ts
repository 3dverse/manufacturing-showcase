import { useMemo } from "react";

import { useTimelineStore } from "@/store/useTimelineStore";
import type { ProductionOrderEntry } from "@/core/Scope";
import { buildClosedIntervals } from "@/core/Calendar";
import { computeAvailableSeconds } from "@/core/Projection";

import type { ProjectedStatus } from "@/core/Projection";

// ---------------------------------------------------------------------------

function classifyStatus(po: ProductionOrderEntry, asOf: number): ProjectedStatus {
    const { actualStart, actualEnd, scheduledStart } = po.timing;
    if (actualEnd !== undefined && actualEnd <= asOf) return "completed";
    if ((actualStart !== undefined && actualStart <= asOf) || scheduledStart <= asOf) return "in_progress";
    return "planned";
}

function effectiveStartOf(po: ProductionOrderEntry): number {
    return po.timing.actualStart ?? po.timing.scheduledStart;
}

function effectiveEndOf(po: ProductionOrderEntry): number {
    return po.timing.actualEnd ?? po.timing.scheduledEnd;
}

// ---------------------------------------------------------------------------

export type CurrentProductionOrder = {
    id: string;
    orderNumber: string;
    customerId: string | null;
    status: ProjectedStatus;
    scheduledStart: number;
    scheduledEnd: number;
    actualStart: number | undefined;
    actualEnd: number | undefined;
    plannedQuantity: number;
    producedQuantity: number; // estimated at asOf
    downtimeCount: number; // total downtime events for this PO in the span
    activeDowntimeCount: number; // currently ongoing at asOf
    totalDowntimeMinutes: number; // cumulative downtime duration up to asOf
};

// ---------------------------------------------------------------------------

/**
 * Returns the first active-or-future production order in the span (sorted by
 * start time), or — if none exists — the most recently completed one.
 * Returns null while the span is loading or empty.
 */
export function useCurrentProductionOrder(): CurrentProductionOrder | null {
    const span = useTimelineStore((s) => s.span);
    const asOf = useTimelineStore((s) => s.asOf);
    const present = useTimelineStore((s) => s.present);
    const targetAsOf = asOf || present;

    return useMemo(() => {
        if (!span) return null;

        const allPOs = Array.from(span.productionOrders.values());

        // Prefer active first, then the earliest future PO
        const activeFuture = allPOs
            .filter((po) => {
                const p = classifyStatus(po, targetAsOf);
                return p === "in_progress" || p === "planned";
            })
            .sort((a, b) => effectiveStartOf(a) - effectiveStartOf(b));

        // Fall back to the last completed PO in the span
        const target =
            activeFuture[0] ??
            allPOs
                .filter((po) => classifyStatus(po, targetAsOf) === "completed")
                .sort((a, b) => effectiveEndOf(b) - effectiveEndOf(a))[0] ??
            null;

        if (!target) return null;

        const status = classifyStatus(target, targetAsOf);
        const effectiveStart = effectiveStartOf(target);
        const effectiveEnd = effectiveEndOf(target);

        const salesOrder = target.erpSalesOrderId ? span.salesOrders.get(target.erpSalesOrderId) : null;

        // Downtime events linked to this PO
        const poDowntimes = Array.from(span.downtimeEvents.values()).filter((dt) => dt.productionOrderId === target.id);
        const activeDowntimes = poDowntimes.filter(
            (dt) => dt.startedAt <= targetAsOf && (dt.endedAt === undefined || dt.endedAt > targetAsOf),
        );
        const totalDowntimeMinutes = poDowntimes.reduce((sum, dt) => {
            const end = dt.endedAt !== undefined ? Math.min(dt.endedAt, targetAsOf) : targetAsOf;
            const start = Math.min(dt.startedAt, targetAsOf);
            return sum + Math.max(0, end - start) / 60;
        }, 0);

        let estimatedProgress: number;
        if (status === "completed") {
            estimatedProgress = 1;
        } else if (status === "planned") {
            estimatedProgress = 0;
        } else {
            const calendarStoppages = buildClosedIntervals(effectiveStart, effectiveEnd);
            const actualStoppages = poDowntimes
                .filter((dt) => dt.startedAt <= targetAsOf)
                .map((dt) => ({ start: dt.startedAt, end: dt.endedAt ?? targetAsOf }));
            const totalAvailable = computeAvailableSeconds(effectiveStart, effectiveEnd, calendarStoppages);
            const elapsedEnd = Math.min(targetAsOf, effectiveEnd);
            const elapsedAvailable = computeAvailableSeconds(effectiveStart, elapsedEnd, [
                ...calendarStoppages,
                ...actualStoppages,
            ]);
            estimatedProgress = totalAvailable > 0 ? Math.min(1, Math.max(0, elapsedAvailable / totalAvailable)) : 1;
        }

        return {
            id: target.id,
            orderNumber: target.orderNumber,
            customerId: salesOrder?.customerId ?? null,
            status,
            scheduledStart: target.timing.scheduledStart,
            scheduledEnd: target.timing.scheduledEnd,
            actualStart: target.timing.actualStart,
            actualEnd: target.timing.actualEnd,
            plannedQuantity: target.quantities.plannedQuantity,
            producedQuantity: Math.round(target.quantities.plannedQuantity * estimatedProgress),
            downtimeCount: poDowntimes.length,
            activeDowntimeCount: activeDowntimes.length,
            totalDowntimeMinutes: Math.round(totalDowntimeMinutes),
        };
    }, [span, targetAsOf]);
}
