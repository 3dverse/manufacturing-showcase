//------------------------------------------------------------------------------
// Snapshot predicates — does this event overlap a point in time (asOf)?
//------------------------------------------------------------------------------
import type {
    SalesOrderEntry,
    ProductionOrderEntry,
    OperationEntry,
    DowntimeEntry,
    WorkOrderEntry,
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
// Percent helpers
//------------------------------------------------------------------------------
export function toPct(ts: number, winStart: number, winEnd: number): number {
    return ((ts - winStart) / (winEnd - winStart)) * 100;
}

export function fromPct(pct: number, winStart: number, winEnd: number): number {
    return winStart + (pct / 100) * (winEnd - winStart);
}
