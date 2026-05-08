import { buildClosedIntervals } from "@/core/Calendar";
import type { ProductionOrderEntry, OperationEntry, DowntimeEntry, WorkOrderEntry } from "@/core/Scope";

// ---------------------------------------------------------------------------
// Schedule utilities
// ---------------------------------------------------------------------------

/** Scheduled (open) seconds in [fromSecs, toSecs). */
export function scheduledSeconds(fromSecs: number, toSecs: number): number {
    if (toSecs <= fromSecs) return 0;
    const closed = buildClosedIntervals(fromSecs, toSecs);
    const closedSecs = closed.reduce((sum, { start, end }) => sum + (end - start), 0);
    return toSecs - fromSecs - closedSecs;
}

// ---------------------------------------------------------------------------
// Interval utilities
// ---------------------------------------------------------------------------

/** Merge overlapping [start, end] pairs into disjoint sorted intervals. */
export function mergeIntervals(intervals: [number, number][]): [number, number][] {
    if (intervals.length === 0) return [];
    intervals.sort((a, b) => a[0] - b[0]);
    const result: [number, number][] = [intervals[0]];
    for (let i = 1; i < intervals.length; i++) {
        const last = result[result.length - 1];
        const [start, end] = intervals[i];
        if (start <= last[1]) {
            last[1] = Math.max(last[1], end);
        } else {
            result.push([start, end]);
        }
    }
    return result;
}

/** Total scheduled seconds covered by a set of (possibly overlapping) intervals. */
export function scheduledSecsOfIntervals(intervals: [number, number][]): number {
    return mergeIntervals(intervals).reduce((sum, [s, e]) => sum + scheduledSeconds(s, e), 0);
}

// ---------------------------------------------------------------------------
// Planned time helpers — callers pick which source to use
// ---------------------------------------------------------------------------

/** Planned intervals derived from production order actual/scheduled timing. */
export function plannedIntervalsFromPOs(
    pos: ProductionOrderEntry[],
    windowStart: number,
    targetAsOf: number,
): [number, number][] {
    const intervals: [number, number][] = [];
    for (const po of pos) {
        const start = po.timing.actualStart ?? po.timing.scheduledStart;
        const end = po.timing.actualEnd ?? po.timing.scheduledEnd;
        if (start >= targetAsOf || end <= windowStart) continue;
        intervals.push([Math.max(start, windowStart), Math.min(end, targetAsOf)]);
    }
    return intervals;
}

/** Planned intervals derived from operation actual/scheduled timing. */
export function plannedIntervalsFromOps(
    ops: OperationEntry[],
    windowStart: number,
    targetAsOf: number,
): [number, number][] {
    const intervals: [number, number][] = [];
    for (const op of ops) {
        const start = op.actualStart ?? op.scheduledStart;
        const end = op.actualEnd ?? op.scheduledEnd;
        if (start >= targetAsOf || end <= windowStart) continue;
        intervals.push([Math.max(start, windowStart), Math.min(end, targetAsOf)]);
    }
    return intervals;
}

// ---------------------------------------------------------------------------
// Quality helpers
// ---------------------------------------------------------------------------

/** Quality (0–1) from completed production orders: goodQty / (goodQty + scrapQty). */
export function qualityFromPOs(pos: ProductionOrderEntry[], windowStart: number, targetAsOf: number): number {
    const completed = pos.filter(
        (po) =>
            po.timing.actualEnd !== undefined &&
            po.timing.actualEnd >= windowStart &&
            po.timing.actualEnd <= targetAsOf,
    );
    const totalGood = completed.reduce((s, po) => s + (po.quantities.goodQuantity ?? 0), 0);
    const totalProduced = completed.reduce(
        (s, po) => s + (po.quantities.goodQuantity ?? 0) + (po.quantities.scrapQuantity ?? 0),
        0,
    );
    return totalProduced > 0 ? totalGood / totalProduced : 1;
}

/** Quality (0–1) from completed operations: goodQty / producedQty. */
export function qualityFromOps(ops: OperationEntry[], windowStart: number, targetAsOf: number): number {
    const completed = ops.filter(
        (op) => op.actualEnd !== undefined && op.actualEnd >= windowStart && op.actualEnd <= targetAsOf,
    );
    const totalGood = completed.reduce((s, op) => s + (op.quantities.goodQuantity ?? 0), 0);
    const totalProduced = completed.reduce((s, op) => s + (op.quantities.producedQuantity ?? 0), 0);
    return totalProduced > 0 ? totalGood / totalProduced : 1;
}

// ---------------------------------------------------------------------------
// OEE computation
// ---------------------------------------------------------------------------

/**
 * Computes OEE (0–100) given pre-computed planned intervals, quality, downtime
 * events, and work orders within [windowStart, targetAsOf].
 *
 * Availability = (planned scheduled time − stoppage scheduled time) / planned scheduled time
 * OEE          = availability × quality × 100
 *
 * Returns null if plannedIntervals covers zero scheduled seconds.
 */
export function computeOEE(
    plannedIntervals: [number, number][],
    quality: number,
    downtimes: DowntimeEntry[],
    workOrders: WorkOrderEntry[],
    windowStart: number,
    targetAsOf: number,
): number | null {
    const plannedSecs = scheduledSecsOfIntervals(plannedIntervals);
    if (plannedSecs === 0) return null;

    const stoppageIntervals: [number, number][] = [];
    for (const dt of downtimes) {
        const start = dt.startedAt;
        const end = dt.endedAt ?? targetAsOf;
        if (start >= targetAsOf || end <= windowStart) continue;
        stoppageIntervals.push([Math.max(start, windowStart), Math.min(end, targetAsOf)]);
    }
    for (const wo of workOrders) {
        const start = wo.actualStart ?? wo.scheduledStart;
        const end = wo.actualEnd ?? wo.scheduledEnd;
        if (start >= targetAsOf || end <= windowStart) continue;
        stoppageIntervals.push([Math.max(start, windowStart), Math.min(end, targetAsOf)]);
    }
    const stoppageSecs = scheduledSecsOfIntervals(stoppageIntervals);

    const availability = Math.max(0, (plannedSecs - stoppageSecs) / plannedSecs);
    return Math.round(availability * quality * 100);
}
