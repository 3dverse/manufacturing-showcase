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

export type ProjectedStatus = "planned" | "in_progress" | "completed";

export type ProjectedSalesOrder = Omit<SalesOrderEntry, "status"> & {
    status: ProjectedStatus;
    projected: {
        isOverdue: boolean;
    };
};

export type ProjectedProductionOrder = Omit<ProductionOrderEntry, "quantities" | "status"> & {
    status: ProjectedStatus;
    projected: {
        estimatedProgress: number; // 0–1, linear interpolation at asOf
        progressPercent: number;
    };
    quantities: ProductionOrderEntry["quantities"] & {
        producedQuantity: number;
    };
};

export type ProjectedOperation = Omit<OperationEntry, "quantities" | "status"> & {
    status: ProjectedStatus;
    projected: {
        estimatedProgress: number; // 0–1
        progressPercent: number;
    };
    quantities: OperationEntry["quantities"] & {
        producedQuantity: number;
    };
};

export type ProjectedDowntime = DowntimeEntry & {
    status: ProjectedStatus;
    projected: {
        durationAtAsOf: number; // seconds elapsed as of asOf
        isOngoing: boolean; // no endedAt, or endedAt is after asOf
    };
};

export type ProjectedWorkOrder = Omit<WorkOrderEntry, "status"> & {
    status: ProjectedStatus;
    projected: {
        isOverdue: boolean;
    };
};

export type ProjectedPickTask = Omit<PickTaskEntry, "status"> & {
    status: ProjectedStatus;
};

export type ProjectedReceipt = Omit<ReceiptEntry, "status"> & {
    status: ProjectedStatus;
    projected: {
        putawayDate: number | null; // denormalized from linked putaway task
    };
};

export type ProjectedPutawayTask = Omit<PutawayTaskEntry, "status"> & {
    status: ProjectedStatus;
    projected: {
        estimatedProgress: number; // 0–1
        progressPercent: number;
    };
};

export type ProjectedAllocation = AllocationEntry; // "allocated" | "partial" — domain status, not time-projected

export type ProjectedPurchaseOrder = Omit<PurchaseOrderEntry, "status"> & {
    status: ProjectedStatus;
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

function classifyStatus(
    scheduledStart: number,
    _scheduledEnd: number,
    actualStart: number | undefined,
    actualEnd: number | undefined,
    asOf: number,
): ProjectedStatus {
    if (actualEnd !== undefined && actualEnd <= asOf) return "completed";
    if (actualStart !== undefined && actualStart <= asOf) return "in_progress";
    if (scheduledStart <= asOf) return "in_progress";
    return "planned";
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

function stoppageAwareInterpolate(
    effectiveStart: number,
    effectiveEnd: number,
    status: ProjectedStatus,
    asOf: number,
    calendarStoppages: Interval[],
    actualStoppages: Interval[],
): number {
    if (status === "completed") return 1;
    if (status === "planned") return 0;
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
    const status: ProjectedStatus =
        asOf > e.requestedDeliveryDate ? "completed" : asOf >= e.orderDate ? "in_progress" : "planned";
    return {
        ...e,
        status,
        projected: {
            isOverdue: asOf > e.requestedDeliveryDate && e.status !== "shipped",
        },
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
    const status = classifyStatus(
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
        status,
        asOf,
        calendarStoppages,
        actualStoppages,
    );
    return {
        ...e,
        status,
        projected: {
            estimatedProgress,
            progressPercent: Math.round(estimatedProgress * 100),
        },
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
    const status = classifyStatus(e.scheduledStart, e.scheduledEnd, e.actualStart, e.actualEnd, asOf);
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
        status,
        asOf,
        calendarStoppages,
        actualStoppages,
    );
    const isPlanned = status === "planned";
    return {
        ...e,
        status,
        projected: {
            estimatedProgress,
            progressPercent: Math.round(estimatedProgress * 100),
        },
        quantities: {
            ...e.quantities,
            producedQuantity: Math.round(e.quantities.plannedQuantity * estimatedProgress),
            goodQuantity: isPlanned ? 0 : Math.round(e.quantities.goodQuantity * estimatedProgress),
            scrapQuantity: isPlanned ? 0 : Math.round(e.quantities.scrapQuantity * estimatedProgress),
        },
    };
}

function projectDowntime(e: DowntimeEntry, asOf: number): ProjectedDowntime {
    const isOngoing = e.endedAt === undefined || e.endedAt > asOf;
    const status: ProjectedStatus = isOngoing ? "in_progress" : "completed";
    const durationAtAsOf = (isOngoing ? asOf : e.endedAt!) - e.startedAt;
    return {
        ...e,
        status,
        projected: { isOngoing, durationAtAsOf },
    };
}

function projectWorkOrder(e: WorkOrderEntry, asOf: number): ProjectedWorkOrder {
    const status = classifyStatus(e.scheduledStart, e.scheduledEnd, e.actualStart, e.actualEnd, asOf);
    return {
        ...e,
        status,
        projected: { isOverdue: status !== "completed" && asOf > e.scheduledEnd },
    };
}

function projectPickTask(e: PickTaskEntry, asOf: number): ProjectedPickTask {
    const startRef = e.startedAt ?? e.createdAt;
    const status: ProjectedStatus =
        e.pickedDate != null && e.pickedDate <= asOf ? "completed" : startRef > asOf ? "planned" : "in_progress";
    return { ...e, status };
}

function projectReceipt(e: ReceiptEntry, putawayDate: number | null, asOf: number): ProjectedReceipt {
    const status: ProjectedStatus =
        putawayDate != null && putawayDate <= asOf ? "completed" : e.receivedDate > asOf ? "planned" : "in_progress";
    return { ...e, status, projected: { putawayDate } };
}

function projectPutawayTask(e: PutawayTaskEntry, asOf: number): ProjectedPutawayTask {
    const startRef = e.startedAt ?? e.createdAt;
    const status: ProjectedStatus =
        e.putawayDate != null && e.putawayDate <= asOf ? "completed" : startRef > asOf ? "planned" : "in_progress";
    const estimatedProgress =
        status === "completed"
            ? 1
            : status === "planned"
              ? 0
              : e.putawayDate != null
                ? clamp((asOf - startRef) / (e.putawayDate - startRef), 0, 1)
                : 0;
    return {
        ...e,
        status,
        projected: {
            estimatedProgress,
            progressPercent: Math.round(estimatedProgress * 100),
        },
    };
}

function projectPurchaseOrder(e: PurchaseOrderEntry, asOf: number): ProjectedPurchaseOrder {
    const status: ProjectedStatus =
        e.receivedAt != null && e.receivedAt <= asOf ? "completed" : e.orderDate > asOf ? "planned" : "in_progress";
    return { ...e, status };
}

//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------

export function projectSnapshot(snapshot: AsOfSnapshot, asOf: number): AsOfProjection {
    const putawayDateByReceipt = new Map<string, number>();
    for (const pt of snapshot.putawayTasks) {
        if (pt.receiptId && pt.putawayDate != null) putawayDateByReceipt.set(pt.receiptId, pt.putawayDate);
    }
    if (!USE_PROJECTION) return snapshot as unknown as AsOfProjection;
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
