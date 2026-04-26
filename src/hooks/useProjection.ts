import { useMemo } from "react";

import { useTimelineStore } from "@/store/useTimelineStore";
import { projectSnapshot, type AsOfProjection } from "@/core/Projection";
import type { AsOfSnapshot, RichSnapshot } from "@/core/Scope";

export function useProjection(snapshot: AsOfSnapshot | RichSnapshot | null): AsOfProjection | null {
    const asOf = useTimelineStore((s) => s.asOf);
    const present = useTimelineStore((s) => s.present);
    return useMemo(
        () => (snapshot ? projectSnapshot(snapshot as AsOfSnapshot, asOf || present) : null),
        [snapshot, asOf, present],
    );
}
