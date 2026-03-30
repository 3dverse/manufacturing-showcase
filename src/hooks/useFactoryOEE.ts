import { useMemo } from "react";

import { useTimelineStore } from "@/store/useTimelineStore";

/**
 * Computes OEE (0–100) for the whole factory by aggregating all completed
 * operations in the current span up to `asOf`.
 *
 * Uses the same formula as useAreaOEE:
 * OEE = Availability × Quality  (Performance is always 100 % in this dataset)
 *
 * Returns null while the span is loading or if no completed operations exist.
 */
export function useFactoryOEE(): number | null {
    const span = useTimelineStore((s) => s.span);
    const asOf = useTimelineStore((s) => s.asOf);

    return useMemo(() => {
        if (!span) return null;

        const completed = [...span.operations.values()].filter(
            (op) => op.actualEnd !== undefined && op.actualEnd <= asOf,
        );
        if (completed.length === 0) return null;

        const totalGood = completed.reduce((s, op) => s + (op.quantities.goodQuantity ?? 0), 0);
        const totalProduced = completed.reduce((s, op) => s + (op.quantities.producedQuantity ?? 0), 0);
        const totalPlanned = completed.reduce((s, op) => s + (op.plannedRunTimeMinutes ?? 0), 0);
        const totalActual = completed.reduce((s, op) => s + (op.actualRunTimeMinutes ?? 0), 0);

        const quality = totalProduced > 0 ? totalGood / totalProduced : 1;
        const availability = totalPlanned > 0 ? Math.min(1, totalActual / totalPlanned) : 1;

        return Math.round(availability * quality * 100);
    }, [span, asOf]);
}
