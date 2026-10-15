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

// Internal: scheduled secs for one interval given pre-computed closed intervals (sorted by start).
function scheduledSecsWithClosed(from: number, to: number, closed: { start: number; end: number }[]): number {
    let closedSecs = 0;
    for (const ci of closed) {
        if (ci.start >= to) break;
        if (ci.end <= from) continue;
        closedSecs += Math.min(ci.end, to) - Math.max(ci.start, from);
    }
    return to - from - closedSecs;
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

/**
 * Clip pre-merged (start-ASC) intervals to [windowStart, targetAsOf].
 * Input must already be merged and sorted by start ascending.
 * Output is ready to pass directly to computeOEE without re-merging.
 */
export function clipIntervalsToWindow(
    mergedIntervals: [number, number][],
    windowStart: number,
    targetAsOf: number,
): [number, number][] {
    const result: [number, number][] = [];
    for (const [s, e] of mergedIntervals) {
        if (s >= targetAsOf) break;
        if (e <= windowStart) continue;
        result.push([Math.max(s, windowStart), Math.min(e, targetAsOf)]);
    }
    return result;
}

// ---------------------------------------------------------------------------
// Single-pass metrics helpers
// ---------------------------------------------------------------------------

/**
 * Single pass over sorted (end-DESC) production orders: returns planned intervals,
 * quality and performance for the window. Avoids iterating the array twice.
 * Performance is produced vs planned quantity of POs completed in the window
 * (planned quantity = ideal rate × planned run time).
 */
export function poMetricsForWindow(
    pos: ProductionOrderEntry[],
    windowStart: number,
    targetAsOf: number,
): { intervals: [number, number][]; quality: number; performance: number } {
    const intervals: [number, number][] = [];
    let totalGood = 0,
        totalProduced = 0,
        totalPlanned = 0;
    for (const po of pos) {
        const end = po.timing.actualEnd ?? po.timing.scheduledEnd;
        if (end <= windowStart) break;
        const start = po.timing.actualStart ?? po.timing.scheduledStart;
        if (start < targetAsOf) {
            intervals.push([Math.max(start, windowStart), Math.min(end, targetAsOf)]);
        }
        if (
            po.timing.actualEnd !== undefined &&
            po.timing.actualEnd >= windowStart &&
            po.timing.actualEnd <= targetAsOf
        ) {
            totalGood += po.quantities.goodQuantity ?? 0;
            totalProduced += (po.quantities.goodQuantity ?? 0) + (po.quantities.scrapQuantity ?? 0);
            totalPlanned += po.quantities.plannedQuantity ?? 0;
        }
    }
    return {
        intervals,
        quality: totalProduced > 0 ? totalGood / totalProduced : 1,
        performance: totalPlanned > 0 ? Math.min(1, totalProduced / totalPlanned) : 1,
    };
}

/**
 * Single pass over operations: returns planned intervals, quality and performance.
 */
export function opMetricsForWindow(
    ops: OperationEntry[],
    windowStart: number,
    targetAsOf: number,
): { intervals: [number, number][]; quality: number; performance: number } {
    const intervals: [number, number][] = [];
    let totalGood = 0,
        totalProduced = 0;
    for (const op of ops) {
        const start = op.actualStart ?? op.scheduledStart;
        const end = op.actualEnd ?? op.scheduledEnd;
        if (end <= windowStart || start >= targetAsOf) continue;
        intervals.push([Math.max(start, windowStart), Math.min(end, targetAsOf)]);
        if (op.actualEnd !== undefined && op.actualEnd >= windowStart && op.actualEnd <= targetAsOf) {
            totalGood += op.quantities.goodQuantity ?? 0;
            totalProduced += op.quantities.producedQuantity ?? 0;
        }
    }
    return {
        intervals,
        quality: totalProduced > 0 ? totalGood / totalProduced : 1,
        performance: performanceFromOps(ops, windowStart, targetAsOf),
    };
}

/**
 * Performance = actual output / ideal output over the net run time of operations
 * completed in [windowStart, targetAsOf]. The ideal rate is plannedQuantity / plannedRunTimeMinutes.
 */
export function performanceFromOps(ops: Iterable<OperationEntry>, windowStart: number, targetAsOf: number): number {
    let totalProduced = 0,
        totalIdeal = 0;
    for (const op of ops) {
        if (op.actualEnd === undefined || op.actualEnd < windowStart || op.actualEnd > targetAsOf) continue;
        if (!op.plannedRunTimeMinutes || op.actualRunTimeMinutes === undefined) continue;
        const idealRatePerMinute = op.quantities.plannedQuantity / op.plannedRunTimeMinutes;
        totalIdeal += idealRatePerMinute * op.actualRunTimeMinutes;
        totalProduced += op.quantities.producedQuantity ?? 0;
    }
    return totalIdeal > 0 ? Math.min(1, totalProduced / totalIdeal) : 1;
}

// ---------------------------------------------------------------------------
// Kept for backward compatibility / standalone use
// ---------------------------------------------------------------------------

export function plannedIntervalsFromPOs(
    pos: ProductionOrderEntry[],
    windowStart: number,
    targetAsOf: number,
): [number, number][] {
    return poMetricsForWindow(pos, windowStart, targetAsOf).intervals;
}

export function plannedIntervalsFromOps(
    ops: OperationEntry[],
    windowStart: number,
    targetAsOf: number,
): [number, number][] {
    return opMetricsForWindow(ops, windowStart, targetAsOf).intervals;
}

export function qualityFromPOs(pos: ProductionOrderEntry[], windowStart: number, targetAsOf: number): number {
    return poMetricsForWindow(pos, windowStart, targetAsOf).quality;
}

export function performanceFromPOs(pos: ProductionOrderEntry[], windowStart: number, targetAsOf: number): number {
    return poMetricsForWindow(pos, windowStart, targetAsOf).performance;
}

export function qualityFromOps(ops: OperationEntry[], windowStart: number, targetAsOf: number): number {
    return opMetricsForWindow(ops, windowStart, targetAsOf).quality;
}

// ---------------------------------------------------------------------------
// OEE computation
// ---------------------------------------------------------------------------

/**
 * Computes OEE (0–100) given pre-computed planned intervals, quality, performance,
 * downtime events, and work orders within [windowStart, targetAsOf].
 *
 * Builds closed intervals once for the window and reuses them for both planned
 * and stoppage scheduled-seconds calculations.
 *
 * Returns null if plannedIntervals covers zero scheduled seconds.
 */
export function computeOEE(
    plannedIntervals: [number, number][],
    quality: number,
    performance: number,
    downtimes: DowntimeEntry[],
    workOrders: WorkOrderEntry[],
    windowStart: number,
    targetAsOf: number,
): number | null {
    // Pre-compute closed intervals once — reused for both planned and stoppage.
    const closed = buildClosedIntervals(windowStart, targetAsOf);

    const mergedPlanned = mergeIntervals(plannedIntervals);
    const plannedSecs = mergedPlanned.reduce((sum, [s, e]) => sum + scheduledSecsWithClosed(s, e, closed), 0);
    if (plannedSecs === 0) return null;

    const stoppageIntervals: [number, number][] = [];
    for (const dt of downtimes) {
        const end = dt.endedAt ?? targetAsOf;
        if (end <= windowStart) break;
        if (dt.startedAt >= targetAsOf) continue;
        stoppageIntervals.push([Math.max(dt.startedAt, windowStart), Math.min(end, targetAsOf)]);
    }
    for (const wo of workOrders) {
        const end = wo.actualEnd ?? wo.scheduledEnd;
        if (end <= windowStart) break;
        const start = wo.actualStart ?? wo.scheduledStart;
        if (start >= targetAsOf) continue;
        stoppageIntervals.push([Math.max(start, windowStart), Math.min(end, targetAsOf)]);
    }
    const mergedStoppage = mergeIntervals(stoppageIntervals);
    const stoppageSecs = mergedStoppage.reduce((sum, [s, e]) => sum + scheduledSecsWithClosed(s, e, closed), 0);

    const availability = Math.max(0, (plannedSecs - stoppageSecs) / plannedSecs);
    return Math.round(availability * performance * quality * 100);
}
