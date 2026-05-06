import { useMemo } from "react";
import { buildCorrelationIndex, correlate, type CorrelatedSet, type FocusedEntity } from "@/core/Correlation";
import type { AsOfSnapshot } from "@/core/Scope";

export function useCorrelation(snapshot: AsOfSnapshot | null, focused: FocusedEntity | null): CorrelatedSet | null {
    const index = useMemo(() => (snapshot ? buildCorrelationIndex(snapshot) : null), [snapshot]);

    return useMemo(() => {
        if (!index || !focused) return null;
        return correlate(focused, index);
    }, [index, focused]);
}
