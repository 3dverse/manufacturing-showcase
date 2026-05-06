import { useState, useEffect } from "react";

import { MES } from "@/core/APIs";

/**
 * Fetches the factory-wide OEE (0–100) from the MES performance endpoint for
 * use on the homepage. Uses the current calendar week (Mon 00:00 → now) as
 * the time range so the number reflects week-to-date performance.
 * Returns null while loading or if the request fails.
 */
export function useFactoryItemOEE(siteId: string): number | null {
    const [oee, setOee] = useState<number | null>(null);

    useEffect(() => {
        if (!siteId) return;
        const now = Math.floor(Date.now() / 1000);
        const d = new Date();
        // ISO week: Monday = day 1; getDay() returns 0 for Sunday
        const dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1;
        d.setHours(0, 0, 0, 0);
        const weekStart = Math.floor(d.getTime() / 1000) - dayOfWeek * 86400;
        MES.getPerformance({ siteId, from: weekStart, to: now })
            .then((r) => setOee(Math.round(r.data.data.oeePercent)))
            .catch(() => {});
    }, [siteId]);

    return oee;
}
