import { useMemo } from "react";

import { useTimelineStore } from "@/store/useTimelineStore";
import type { AreaNode } from "@/content/type";

/**
 * Computes OEE (0–100) for an area by aggregating all completed operations
 * scoped to the area's work centers up to `asOf`.
 *
 * OEE = Availability × Quality
 * (Performance is always 100 % in this dataset)
 *
 * Returns null while the span is loading or if no completed operations exist.
 */
export function useAreaOEE(area: AreaNode): number | null {
    const span = useTimelineStore((s) => s.span);
    const asOf = useTimelineStore((s) => s.asOf);

    return useMemo(() => {
        if (!span) return null;

        const wcIds = [...area.lines.flatMap((l) => l.cells.map((c) => c.hash)), ...area.cells.map((c) => c.hash)];

        const opIds = wcIds.flatMap((wcId) => span.operationsByWorkCenter.get(wcId) ?? []);
        const ops = [...new Set(opIds)].flatMap((id) => {
            const op = span.operations.get(id);
            return op ? [op] : [];
        });

        const completed = ops.filter((op) => op.actualEnd !== undefined && op.actualEnd <= asOf);
        if (completed.length === 0) return null;

        const totalGood = completed.reduce((s, op) => s + (op.quantities.goodQuantity ?? 0), 0);
        const totalProduced = completed.reduce((s, op) => s + (op.quantities.producedQuantity ?? 0), 0);
        const totalPlanned = completed.reduce((s, op) => s + (op.plannedRunTimeMinutes ?? 0), 0);
        const totalActual = completed.reduce((s, op) => s + (op.actualRunTimeMinutes ?? 0), 0);

        const quality = totalProduced > 0 ? totalGood / totalProduced : 1;
        const availability = totalPlanned > 0 ? Math.min(1, totalActual / totalPlanned) : 1;

        return Math.round(availability * quality * 100);
    }, [span, asOf, area]);
}
