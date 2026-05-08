//------------------------------------------------------------------------------
// Snapshot predicates — does this event overlap a point in time (asOf)?
//------------------------------------------------------------------------------
import type {
    SalesOrderEntry,
    ProductionOrderEntry,
    OperationEntry,
    DowntimeEntry,
    WorkOrderEntry,
    TimelineSpan,
} from "@/core/Scope";

function overlapsAsOf(start: number, end: number | undefined, asOf: number): boolean {
    if (start > asOf) return false;
    if (end === undefined) return true; // open/ongoing event
    return end >= asOf;
}

export const salesOrderAtAsOf = (e: SalesOrderEntry, asOf: number) =>
    overlapsAsOf(e.orderDate, e.requestedDeliveryDate, asOf);

export const productionOrderAtAsOf = (e: ProductionOrderEntry, asOf: number) =>
    overlapsAsOf(e.timing.actualStart ?? e.timing.scheduledStart, e.timing.actualEnd ?? e.timing.scheduledEnd, asOf);

export const operationAtAsOf = (e: OperationEntry, asOf: number) =>
    overlapsAsOf(e.actualStart ?? e.scheduledStart, e.actualEnd ?? e.scheduledEnd, asOf);

export const downtimeAtAsOf = (e: DowntimeEntry, asOf: number) => overlapsAsOf(e.startedAt, e.endedAt, asOf);

export const workOrderAtAsOf = (e: WorkOrderEntry, asOf: number) =>
    overlapsAsOf(e.actualStart ?? e.scheduledStart, e.actualEnd ?? e.scheduledEnd, asOf);

//------------------------------------------------------------------------------
// Active-at-t queries — leverage insertion-order sort (startedAt / scheduledStart asc)
// to break early once we're past t.
//------------------------------------------------------------------------------

/** All downtime events active at t (startedAt ≤ t, endedAt undefined or ≥ t). */
export function activeDowntimesAt(span: TimelineSpan, t: number): DowntimeEntry[] {
    const result: DowntimeEntry[] = [];
    for (const dt of span.sortedDowntimes) {
        if (dt.endedAt !== undefined && dt.endedAt < t) break;
        if (dt.startedAt <= t) result.push(dt);
    }
    return result;
}

/** Returns true if any downtime event is active at t. */
export function hasActiveDowntimeAt(span: TimelineSpan, t: number): boolean {
    const arr = span.sortedDowntimes;
    let lo = 0,
        hi = arr.length;
    while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        const end = arr[mid].endedAt;
        if (end === undefined || end >= t) lo = mid + 1;
        else hi = mid;
    }
    for (let i = 0; i < lo; i++) {
        if (arr[i].startedAt <= t) return true;
    }
    return false;
}

/** All work orders active at t. */
export function activeWorkOrdersAt(span: TimelineSpan, t: number): WorkOrderEntry[] {
    const result: WorkOrderEntry[] = [];
    for (const wo of span.sortedWorkOrders) {
        if ((wo.actualEnd ?? wo.scheduledEnd) < t) break;
        if ((wo.actualStart ?? wo.scheduledStart) <= t) result.push(wo);
    }
    return result;
}

/** Returns true if any work order is active at t. */
export function hasActiveWorkOrderAt(span: TimelineSpan, t: number): boolean {
    const arr = span.sortedWorkOrders;
    let lo = 0,
        hi = arr.length;
    while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if ((arr[mid].actualEnd ?? arr[mid].scheduledEnd) >= t) lo = mid + 1;
        else hi = mid;
    }
    for (let i = 0; i < lo; i++) {
        if ((arr[i].actualStart ?? arr[i].scheduledStart) <= t) return true;
    }
    return false;
}

//------------------------------------------------------------------------------
// Percent helpers
//------------------------------------------------------------------------------
export function toPct(ts: number, winStart: number, winEnd: number): number {
    return ((ts - winStart) / (winEnd - winStart)) * 100;
}

export function fromPct(pct: number, winStart: number, winEnd: number): number {
    return winStart + (pct / 100) * (winEnd - winStart);
}
