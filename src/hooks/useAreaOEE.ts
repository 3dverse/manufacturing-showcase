import { useMemo } from "react";

import { useTimelineStore } from "@/store/useTimelineStore";
import type { SceneGraphNode } from "@/content/type";
import { NodeTypes } from "@/content/enums";

/**
 * Computes OEE (0–100) for an area by aggregating all completed operations
 * scoped to the area's work centers up to `asOf`.
 *
 * OEE = Availability × Quality
 * (Performance is always 100 % in this dataset)
 *
 * Returns null while the span is loading or if no completed operations exist.
 */
export function useAreaOEE(node: SceneGraphNode): number | undefined {
    //--------------------------------------------------------------------------
    // Store
    const asOf = useTimelineStore((s) => s.asOf);
    const present = useTimelineStore((s) => s.present);
    const span = useTimelineStore((s) => s.span);

    //--------------------------------------------------------------------------
    // Memos
    return useMemo(() => {
        if (node.type !== NodeTypes.area || node.name !== "production") return undefined;
        if (!span) return undefined;

        const wcIds = [...node.lines.flatMap((l) => l.cells.map((c) => c.hash)), ...node.cells.map((c) => c.hash)];

        const opIds = wcIds.flatMap((wcId) => span.operationsByWorkCenter.get(wcId) ?? []);
        const ops = [...new Set(opIds)].flatMap((id) => {
            const op = span.operations.get(id);
            return op ? [op] : [];
        });

        const cutoff = asOf || present;
        const windowStart = cutoff - 7 * 86400;
        const completed = ops.filter(
            (op) => op.actualEnd !== undefined && op.actualEnd >= windowStart && op.actualEnd <= cutoff,
        );
        if (completed.length === 0) return;

        const totalGood = completed.reduce((s, op) => s + (op.quantities.goodQuantity ?? 0), 0);
        const totalProduced = completed.reduce((s, op) => s + (op.quantities.producedQuantity ?? 0), 0);
        const totalPlanned = completed.reduce((s, op) => s + (op.plannedRunTimeMinutes ?? 0), 0);
        const totalActual = completed.reduce((s, op) => s + (op.actualRunTimeMinutes ?? 0), 0);

        const quality = totalProduced > 0 ? totalGood / totalProduced : 1;
        const availability = totalPlanned > 0 ? Math.min(1, totalActual / totalPlanned) : 1;

        return Math.round(availability * quality * 100);
    }, [span, asOf, present, node]);
}
