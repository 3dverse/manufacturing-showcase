import type {
    SalesOrderEntry,
    ProductionOrderEntry,
    OperationEntry,
    DowntimeEntry,
    WorkOrderEntry,
    PickTaskEntry,
    ReceiptEntry,
    PutawayTaskEntry,
    AllocationEntry,
    TimelineLevel,
    AsOfSnapshot,
} from "@/core/Scope";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Phase = "completed" | "active" | "future";

export type ProjectedSalesOrder = SalesOrderEntry & {
    phase:     Phase;    // completed if shipped, active if asOf within window, future otherwise
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

export type ProjectedOperation = OperationEntry & {
    phase: Phase;
    effectiveStart: number;
    effectiveEnd: number;
    estimatedProgress: number; // 0–1
    progressPercent: number; // replaces API value: round(estimatedProgress * 100)
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
};

export type ProjectedAllocation = AllocationEntry; // point-in-time; no time-based projection needed

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

function interpolateProgress(effectiveStart: number, effectiveEnd: number, phase: Phase, asOf: number): number {
    if (phase === "completed") return 1;
    if (phase === "future") return 0;
    const span = effectiveEnd - effectiveStart;
    if (span <= 0) return 1;
    return clamp((asOf - effectiveStart) / span, 0, 1);
}

// ---------------------------------------------------------------------------
// Per-type projectors
// ---------------------------------------------------------------------------

function projectSalesOrder(e: SalesOrderEntry, asOf: number): ProjectedSalesOrder {
    const phase: Phase =
        asOf > e.requestedDeliveryDate ? "completed" :
        asOf >= e.orderDate            ? "active"    :
                                         "future";
    return {
        ...e,
        phase,
        isOverdue: asOf > e.requestedDeliveryDate && e.status !== "shipped",
    };
}

function projectProductionOrder(e: ProductionOrderEntry, asOf: number): ProjectedProductionOrder {
    const effectiveStart = e.timing.actualStart ?? e.timing.scheduledStart;
    const effectiveEnd = e.timing.actualEnd ?? e.timing.scheduledEnd;
    const phase = classifyPhase(
        e.timing.scheduledStart,
        e.timing.scheduledEnd,
        e.timing.actualStart,
        e.timing.actualEnd,
        asOf,
    );
    const estimatedProgress = interpolateProgress(effectiveStart, effectiveEnd, phase, asOf);
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

function projectOperation(e: OperationEntry, asOf: number): ProjectedOperation {
    const effectiveStart = e.actualStart ?? e.scheduledStart;
    const effectiveEnd = e.actualEnd ?? e.scheduledEnd;
    const phase = classifyPhase(e.scheduledStart, e.scheduledEnd, e.actualStart, e.actualEnd, asOf);
    const estimatedProgress = interpolateProgress(effectiveStart, effectiveEnd, phase, asOf);
    return {
        ...e,
        phase,
        effectiveStart,
        effectiveEnd,
        estimatedProgress,
        progressPercent: Math.round(estimatedProgress * 100),
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
    const phase: Phase =
        e.pickedDate != null && e.pickedDate <= asOf ? "completed" :
        e.createdAt > asOf                           ? "future"    :
                                                       "active";
    return { ...e, phase };
}

function projectReceipt(e: ReceiptEntry, putawayDate: number | null, asOf: number): ProjectedReceipt {
    const phase: Phase =
        putawayDate != null && putawayDate <= asOf ? "completed" :
        e.receivedDate > asOf                      ? "future"    :
                                                     "active";
    return { ...e, phase, putawayDate };
}

function projectPutawayTask(e: PutawayTaskEntry, asOf: number): ProjectedPutawayTask {
    const phase: Phase =
        e.putawayDate != null && e.putawayDate <= asOf ? "completed" :
        e.createdAt > asOf                             ? "future"    :
                                                         "active";
    return { ...e, phase };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function projectSnapshot(snapshot: AsOfSnapshot, asOf: number): AsOfProjection {
    // Build a receipt-id → putawayDate lookup for denormalising onto receipts
    const putawayDateByReceipt = new Map<string, number>();
    for (const pt of snapshot.putawayTasks) {
        if (pt.receiptId && pt.putawayDate != null) putawayDateByReceipt.set(pt.receiptId, pt.putawayDate);
    }

    return {
        level: snapshot.level,
        salesOrders: snapshot.salesOrders.map((e) => projectSalesOrder(e, asOf)),
        productionOrders: snapshot.productionOrders.map((e) => projectProductionOrder(e, asOf)),
        operations: snapshot.operations.map((e) => projectOperation(e, asOf)),
        downtimeEvents: snapshot.downtimeEvents.map((e) => projectDowntime(e, asOf)),
        eamWorkOrders: snapshot.eamWorkOrders.map((e) => projectWorkOrder(e, asOf)),
        pickTasks: snapshot.pickTasks.map((e) => projectPickTask(e, asOf)),
        receipts: snapshot.receipts.map((e) => projectReceipt(e, putawayDateByReceipt.get(e.id) ?? null, asOf)),
        putawayTasks: snapshot.putawayTasks.map((e) => projectPutawayTask(e, asOf)),
        allocations: snapshot.allocations,
    };
}
