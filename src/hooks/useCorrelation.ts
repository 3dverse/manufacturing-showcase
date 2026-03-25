import { useMemo } from "react";
import { buildCorrelationIndex, correlate, type CorrelatedSet, type FocusedEntity } from "@/core/Correlation";
import type { AsOfProjection } from "@/core/Projection";

export function useCorrelation(
    projection: AsOfProjection | null,
    focused: FocusedEntity | null,
): CorrelatedSet | null {
    // Build index whenever projection changes (scope/asOf change)
    const index = useMemo(
        () => (projection ? buildCorrelationIndex(projection) : null),
        [projection],
    );

    // Compute correlated set whenever focused entity or index changes
    return useMemo(() => {
        if (!index || !focused) return null;
        return correlate(focused, index);
    }, [index, focused]);
}
