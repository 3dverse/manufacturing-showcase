import { USE_PROJECTION } from "@/content/3dverse";
import { buildClosedIntervals } from "@/core/Calendar";
import type {
    SalesOrderEntry,
    ProductionOrderEntry,
    OperationEntry,
    DowntimeEntry,
    WorkOrderEntry,
    PickTaskEntry,
    ReceiptEntry,
    PutawayTaskEntry,
    PurchaseOrderEntry,
    AllocationEntry,
    TimelineLevel,
    AsOfSnapshot,
} from "@/core/Scope";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Phase = "completed" | "active" | "future";

export type ProjectedSalesOrder = SalesOrderEntry & {
    phase: Phase; // completed if shipped, active if asOf within window, future otherwise
    isOverdue: boolean;
};

export type ProjectedProductionOrder = Omit<ProductionOrderEntry, "quantities"> & {
    phase: Phase;
    effectiveStart: number;
    effectiveEnd: number;
    estimatedProgress: number; // 0–1, linear interpolation at asOf
    progressPercent: number; // replaces API value: round(estimatedProgress * 100)
    quantities: ProductionOrderEntry["quantities"] & {
        producedQuantity: number; // replaces API value: plannedQuantity * estimatedProgress
    };
};

export type ProjectedOperation = Omit<OperationEntry, "quantities"> & {
    phase: Phase;
    effectiveStart: number;
    effectiveEnd: number;
    estimatedProgress: number; // 0–1
    progressPercent: number; // replaces API value: round(estimatedProgress * 100)
    quantities: OperationEntry["quantities"] & {
        producedQuantity: number; // replaces API value: plannedQuantity * estimatedProgress
    };
};

export type ProjectedDowntime = DowntimeEntry & {
    durationAtAsOf: number; // seconds elapsed as of asOf
    isOngoing: boolean; // no endedAt, or endedAt is after asOf
};

export type ProjectedWorkOrder = WorkOrderEntry & {
    phase: Phase;
    effectiveStart: number;
    effectiveEnd: number;
    isOverdue: boolean; // past scheduledEnd and not completed
};

export type ProjectedPickTask = PickTaskEntry & {
    phase: Phase; // completed if pickedDate <= asOf, future if createdAt > asOf, else active
};

export type ProjectedReceipt = ReceiptEntry & {
    phase: Phase; // completed if putawayDate <= asOf, active if receivedDate <= asOf, else future
    putawayDate: number | null; // denormalized from linked putaway task
};

export type ProjectedPutawayTask = PutawayTaskEntry & {
    phase: Phase; // completed if putawayDate <= asOf, future if createdAt > asOf, else active
    estimatedProgress: number; // 0–1; interpolated between createdAt and putawayDate when both are known
    progressPercent: number;
};

export type ProjectedAllocation = AllocationEntry; // point-in-time; no time-based projection needed

export type ProjectedPurchaseOrder = PurchaseOrderEntry & {
    phase: Phase; // completed if receivedAt <= asOf, future if orderDate > asOf, else active
};

export type AsOfProjection = {
    level: TimelineLevel;
    salesOrders: ProjectedSalesOrder[];
    productionOrders: ProjectedProductionOrder[];
    operations: ProjectedOperation[];
    downtimeEvents: ProjectedDowntime[];
    eamWorkOrders: ProjectedWorkOrder[];
    pickTasks: ProjectedPickTask[];
    receipts: ProjectedReceipt[];
    putawayTasks: ProjectedPutawayTask[];
    purchaseOrders: ProjectedPurchaseOrder[];
    allocations: ProjectedAllocation[];
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function clamp(v: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, v));
}

function classifyPhase(
    scheduledStart: number,
    _scheduledEnd: number,
    actualStart: number | undefined,
    actualEnd: number | undefined,
    asOf: number,
): Phase {
    if (actualEnd !== undefined && actualEnd <= asOf) return "completed";
    if (actualStart !== undefined && actualStart <= asOf) return "active";
    if (scheduledStart <= asOf) return "active";
    return "future";
}

type Interval = { start: number; end: number };

export function mergeIntervals(intervals: Interval[]): Interval[] {
    if (intervals.length === 0) return [];
    const sorted = [...intervals].sort((a, b) => a.start - b.start);
    const merged: Interval[] = [{ ...sorted[0] }];
    for (let i = 1; i < sorted.length; i++) {
        const last = merged[merged.length - 1];
        if (sorted[i].start <= last.end) {
            last.end = Math.max(last.end, sorted[i].end);
        } else {
            merged.push({ ...sorted[i] });
        }
    }
    return merged;
}

/** Seconds within [start, end] not covered by any stoppage interval. */
export function computeAvailableSeconds(start: number, end: number, stoppages: Interval[]): number {
    if (end <= start) return 0;
    let blocked = 0;
    for (const s of mergeIntervals(stoppages)) {
        const oStart = Math.max(s.start, start);
        const oEnd = Math.min(s.end, end);
        if (oStart < oEnd) blocked += oEnd - oStart;
    }
    return Math.max(0, end - start - blocked);
}

/**
 * Progress interpolation that accounts for stoppages.
 *
 * - Total denominator: calendar-only (scheduled working time over full span).
 *   Future stoppages (downtime, work orders) are unknown, so they don't
 *   deflate the denominator.
 * - Numerator: calendar + actual stoppages (downtime, work orders) elapsed
 *   up to asOf — so quantity cannot increase while the machine is stopped.
 */
function stoppageAwareInterpolate(
    effectiveStart: number,
    effectiveEnd: number,
    phase: Phase,
    asOf: number,
    calendarStoppages: Interval[],
    actualStoppages: Interval[],
): number {
    if (phase === "completed") return 1;
    if (phase === "future") return 0;
    const totalAvailable = computeAvailableSeconds(effectiveStart, effectiveEnd, calendarStoppages);
    if (totalAvailable <= 0) return 1;
    const elapsedEnd = Math.min(asOf, effectiveEnd);
    const elapsedAvailable = computeAvailableSeconds(effectiveStart, elapsedEnd, [
        ...calendarStoppages,
        ...actualStoppages,
    ]);
    return clamp(elapsedAvailable / totalAvailable, 0, 1);
}

// ---------------------------------------------------------------------------
// Per-type projectors
// ---------------------------------------------------------------------------

function projectSalesOrder(e: SalesOrderEntry, asOf: number): ProjectedSalesOrder {
    const phase: Phase = asOf > e.requestedDeliveryDate ? "completed" : asOf >= e.orderDate ? "active" : "future";
    return {
        ...e,
        phase,
        isOverdue: asOf > e.requestedDeliveryDate && e.status !== "shipped",
    };
}

function projectProductionOrder(
    e: ProductionOrderEntry,
    asOf: number,
    downtimes: DowntimeEntry[],
    workOrders: WorkOrderEntry[],
): ProjectedProductionOrder {
    const effectiveStart = e.timing.actualStart ?? e.timing.scheduledStart;
    const effectiveEnd = e.timing.actualEnd ?? e.timing.scheduledEnd;
    const phase = classifyPhase(
        e.timing.scheduledStart,
        e.timing.scheduledEnd,
        e.timing.actualStart,
        e.timing.actualEnd,
        asOf,
    );
    const calendarStoppages = buildClosedIntervals(effectiveStart, effectiveEnd);
    const actualStoppages: Interval[] = [
        ...downtimes.map((dt) => ({ start: dt.startedAt, end: dt.endedAt ?? asOf })),
        ...workOrders.map((wo) => ({
            start: wo.actualStart ?? wo.scheduledStart,
            end: wo.actualEnd ?? wo.scheduledEnd,
        })),
    ];
    const estimatedProgress = stoppageAwareInterpolate(
        effectiveStart,
        effectiveEnd,
        phase,
        asOf,
        calendarStoppages,
        actualStoppages,
    );
    return {
        ...e,
        phase,
        effectiveStart,
        effectiveEnd,
        estimatedProgress,
        progressPercent: Math.round(estimatedProgress * 100),
        quantities: {
            ...e.quantities,
            producedQuantity: Math.round(e.quantities.plannedQuantity * estimatedProgress),
        },
    };
}

function projectOperation(
    e: OperationEntry,
    asOf: number,
    downtimes: DowntimeEntry[],
    workOrders: WorkOrderEntry[],
): ProjectedOperation {
    const effectiveStart = e.actualStart ?? e.scheduledStart;
    const effectiveEnd = e.actualEnd ?? e.scheduledEnd;
    const phase = classifyPhase(e.scheduledStart, e.scheduledEnd, e.actualStart, e.actualEnd, asOf);
    const calendarStoppages = buildClosedIntervals(effectiveStart, effectiveEnd);
    const relevantDowntimes = downtimes.filter((dt) => dt.workCenterId === e.workCenterId);
    const actualStoppages: Interval[] = [
        ...relevantDowntimes.map((dt) => ({ start: dt.startedAt, end: dt.endedAt ?? asOf })),
        ...workOrders.map((wo) => ({
            start: wo.actualStart ?? wo.scheduledStart,
            end: wo.actualEnd ?? wo.scheduledEnd,
        })),
    ];
    const estimatedProgress = stoppageAwareInterpolate(
        effectiveStart,
        effectiveEnd,
        phase,
        asOf,
        calendarStoppages,
        actualStoppages,
    );
    const isFuture = phase === "future";
    return {
        ...e,
        phase,
        effectiveStart,
        effectiveEnd,
        estimatedProgress,
        progressPercent: Math.round(estimatedProgress * 100),
        quantities: {
            ...e.quantities,
            producedQuantity: Math.round(e.quantities.plannedQuantity * estimatedProgress),
            goodQuantity: isFuture ? 0 : Math.round(e.quantities.goodQuantity * estimatedProgress),
            scrapQuantity: isFuture ? 0 : Math.round(e.quantities.scrapQuantity * estimatedProgress),
        },
    };
}

function projectDowntime(e: DowntimeEntry, asOf: number): ProjectedDowntime {
    const isOngoing = e.endedAt === undefined || e.endedAt > asOf;
    const durationAtAsOf = (isOngoing ? asOf : e.endedAt!) - e.startedAt;
    return { ...e, durationAtAsOf, isOngoing };
}

function projectWorkOrder(e: WorkOrderEntry, asOf: number): ProjectedWorkOrder {
    const effectiveStart = e.actualStart ?? e.scheduledStart;
    const effectiveEnd = e.actualEnd ?? e.scheduledEnd;
    const phase = classifyPhase(e.scheduledStart, e.scheduledEnd, e.actualStart, e.actualEnd, asOf);
    const isOverdue = phase !== "completed" && asOf > e.scheduledEnd;
    return { ...e, phase, effectiveStart, effectiveEnd, isOverdue };
}

function projectPickTask(e: PickTaskEntry, asOf: number): ProjectedPickTask {
    const startRef = e.startedAt ?? e.createdAt;
    const phase: Phase =
        e.pickedDate != null && e.pickedDate <= asOf ? "completed" : startRef > asOf ? "future" : "active";
    return { ...e, phase };
}

function projectReceipt(e: ReceiptEntry, putawayDate: number | null, asOf: number): ProjectedReceipt {
    const phase: Phase =
        putawayDate != null && putawayDate <= asOf ? "completed" : e.receivedDate > asOf ? "future" : "active";
    return { ...e, phase, putawayDate };
}

function projectPutawayTask(e: PutawayTaskEntry, asOf: number): ProjectedPutawayTask {
    const startRef = e.startedAt ?? e.createdAt;
    const phase: Phase =
        e.putawayDate != null && e.putawayDate <= asOf ? "completed" : startRef > asOf ? "future" : "active";
    const estimatedProgress =
        phase === "completed"
            ? 1
            : phase === "future"
              ? 0
              : e.putawayDate != null
                ? clamp((asOf - startRef) / (e.putawayDate - startRef), 0, 1)
                : 0; // active with no putawayDate — can't interpolate
    return {
        ...e,
        phase,
        estimatedProgress,
        progressPercent: Math.round(estimatedProgress * 100),
    } satisfies ProjectedPutawayTask;
}

function projectPurchaseOrder(e: PurchaseOrderEntry, asOf: number): ProjectedPurchaseOrder {
    const phase: Phase =
        e.receivedAt != null && e.receivedAt <= asOf ? "completed" : e.orderDate > asOf ? "future" : "active";
    return { ...e, phase };
}

//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------

export function projectSnapshot(snapshot: AsOfSnapshot, asOf: number): AsOfProjection {
    // Build a receipt-id → putawayDate lookup for denormalising onto receipts
    const putawayDateByReceipt = new Map<string, number>();
    for (const pt of snapshot.putawayTasks) {
        if (pt.receiptId && pt.putawayDate != null) putawayDateByReceipt.set(pt.receiptId, pt.putawayDate);
    }
    if (!USE_PROJECTION) return snapshot as AsOfProjection;
    return {
        level: snapshot.level,
        salesOrders: snapshot.salesOrders.map((e) => projectSalesOrder(e, asOf)),
        productionOrders: snapshot.productionOrders.map((e) =>
            projectProductionOrder(e, asOf, snapshot.downtimeEvents, snapshot.eamWorkOrders),
        ),
        operations: snapshot.operations.map((e) =>
            projectOperation(e, asOf, snapshot.downtimeEvents, snapshot.eamWorkOrders),
        ),
        downtimeEvents: snapshot.downtimeEvents.map((e) => projectDowntime(e, asOf)),
        eamWorkOrders: snapshot.eamWorkOrders.map((e) => projectWorkOrder(e, asOf)),
        pickTasks: snapshot.pickTasks.map((e) => projectPickTask(e, asOf)),
        receipts: snapshot.receipts.map((e) => projectReceipt(e, putawayDateByReceipt.get(e.id) ?? null, asOf)),
        putawayTasks: snapshot.putawayTasks.map((e) => projectPutawayTask(e, asOf)),
        purchaseOrders: snapshot.purchaseOrders.map((e) => projectPurchaseOrder(e, asOf)),
        allocations: snapshot.allocations,
    };
}
