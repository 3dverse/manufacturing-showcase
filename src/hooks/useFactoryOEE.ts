import { useState, useEffect } from "react";

import { MES } from "@/core/APIs";
import { spanWindow } from "@/core/Span";

/**
 * Fetches the factory-wide OEE (0–100) from the MES performance endpoint.
 * No workCenterId is passed so the server aggregates across all work centers.
 * Returns null while loading or if the request fails.
 */
export function useFactoryOEE(siteId: string): number | null {
    const [oee, setOee] = useState<number | null>(null);

    useEffect(() => {
        if (!siteId) return;
        const { from, to } = spanWindow();
        MES.getPerformance({ siteId, from, to })
            .then((r) => setOee(Math.round(r.data.data.oeePercent)))
            .catch(() => {});
    }, [siteId]);

    return oee;
}
