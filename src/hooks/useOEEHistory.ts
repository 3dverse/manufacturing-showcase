import { useMemo } from "react";

import { useTimelineStore } from "@/store/useTimelineStore";
import { workCenterIdsFromNode } from "@/core/Scope";
import type { OEEBucketEntry } from "@/core/Scope";
import type { SceneGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
const SPARKLINE_DAYS = 14;

//------------------------------------------------------------------------------
/** Aggregate shift-level OEE buckets into one OEE value per calendar day. */
export function bucketsToDaily(buckets: OEEBucketEntry[]): number[] {
    const byDay = new Map<string, { runtime: number; planned: number; good: number; produced: number }>();
    for (const b of buckets) {
        const day = new Date(b.shiftStart * 1000).toISOString().slice(0, 10);
        const existing = byDay.get(day) ?? { runtime: 0, planned: 0, good: 0, produced: 0 };
        existing.runtime += b.runtimeMinutes;
        existing.planned += b.plannedMinutes;
        existing.good += b.goodQuantity;
        existing.produced += b.producedQuantity;
        byDay.set(day, existing);
    }
    return [...byDay.values()].map(({ runtime, planned, good, produced }) => {
        const availability = planned > 0 ? runtime / planned : 0;
        const quality = produced > 0 ? good / produced : 1;
        return Math.round(availability * quality * 100 * 10) / 10;
    });
}

//------------------------------------------------------------------------------
/**
 * Returns daily OEE values for the 14-day window ending at asOf (or present),
 * aggregated across all work centers belonging to the given node.
 * Returns an empty array while the span is loading or has no data.
 */
export function useOEEHistory(node: SceneGraphNode): number[] {
    const span = useTimelineStore((s) => s.span);
    const asOf = useTimelineStore((s) => s.asOf);
    const present = useTimelineStore((s) => s.present);

    return useMemo(() => {
        if (!span) return [];
        const cutoff = asOf ?? present;
        const windowStart = cutoff - SPARKLINE_DAYS * 24 * 3600;
        const wcIds = workCenterIdsFromNode(node);
        const buckets = wcIds.flatMap((id) => span.oeeByWorkCenter.get(id) ?? []);
        const inWindow = buckets.filter((b) => b.shiftStart >= windowStart && b.shiftEnd <= cutoff);
        return bucketsToDaily(inWindow);
    }, [span, asOf, present, node]);
}
