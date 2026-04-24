import { useState, useEffect } from "react";

import { MES } from "@/core/APIs";
import { spanWindow } from "@/core/Span";

/**
 * Fetches the factory-wide OEE (0–100) from the MES performance endpoint for
 * use on the homepage, where no span or timeline store is available.
 * Uses spanWindow() as the time range.
 * Returns null while loading or if the request fails.
 */
export function useFactoryItemOEE(siteId: string): number | null {
    const [oee, setOee] = useState<number | null>(null);

    useEffect(() => {
        if (!siteId) return;
        const { from, to } = spanWindow(Math.floor(Date.now() / 1000));
        MES.getPerformance({ siteId, from, to })
            .then((r) => setOee(Math.round(r.data.data.oeePercent)))
            .catch(() => {});
    }, [siteId]);

    return oee;
}
