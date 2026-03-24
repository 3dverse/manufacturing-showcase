import { useEffect, useMemo } from "react";

import { useTimelineStore } from "@/store/useTimelineStore";
import { useDetailStore } from "@/store/useDetailStore";
import { useFactoryStore } from "@/store/useFactoryStore";
import type { TimelineScope, AsOfSnapshot, RichSnapshot } from "@/core/Scope";
import {
    salesOrderAtAsOf,
    productionOrderAtAsOf,
    operationAtAsOf,
    downtimeAtAsOf,
    workOrderAtAsOf,
} from "@/components/timeline/timeUtils";

export function useSnapshot(scope: TimelineScope | null): {
    snapshot: RichSnapshot | null;
    isLoading: boolean;
} {
    const asOf          = useTimelineStore((s) => s.asOf);
    const siteId        = useFactoryStore((s) => s.currentFactory?.scene_id ?? "");
    const poCache       = useDetailStore((s) => s.poCache);
    const opCache       = useDetailStore((s) => s.opCache);
    const isLoading     = useDetailStore((s) => s.isLoading);
    const loadDetails   = useDetailStore((s) => s.loadDetails);

    // Sync filter — same as before
    const filtered = useMemo((): AsOfSnapshot | null => {
        if (!scope) return null;
        return {
            level:            scope.level,
            salesOrders:      scope.salesOrders.filter((e) => salesOrderAtAsOf(e, asOf)),
            productionOrders: scope.productionOrders.filter((e) => productionOrderAtAsOf(e, asOf)),
            operations:       scope.operations.filter((e) => operationAtAsOf(e, asOf)),
            downtimeEvents:   scope.downtimeEvents.filter((e) => downtimeAtAsOf(e, asOf)),
            eamWorkOrders:    scope.eamWorkOrders.filter((e) => workOrderAtAsOf(e, asOf)),
        };
    }, [scope, asOf]);

    // Trigger detail fetches when filtered snapshot changes
    useEffect(() => {
        if (filtered && siteId) loadDetails(filtered, siteId);
    }, [filtered, siteId, loadDetails]);

    // Merge cache entries into a RichSnapshot — null until all items are loaded
    const snapshot = useMemo((): RichSnapshot | null => {
        if (!filtered) return null;

        const richPOs = filtered.productionOrders.map((po) => poCache.get(po.id));
        const richOps = filtered.operations.map((op) => opCache.get(op.id));

        if (richPOs.some((po) => po === undefined)) return null;
        if (richOps.some((op) => op === undefined)) return null;

        return {
            ...filtered,
            productionOrders: richPOs as NonNullable<typeof richPOs[number]>[],
            operations:       richOps as NonNullable<typeof richOps[number]>[],
        };
    }, [filtered, poCache, opCache]);

    return { snapshot, isLoading };
}
