//------------------------------------------------------------------------------
// Percent helpers
//------------------------------------------------------------------------------
export function toPct(ts: number, winStart: number, winEnd: number): number {
    return ((ts - winStart) / (winEnd - winStart)) * 100;
}

export function fromPct(pct: number, winStart: number, winEnd: number): number {
    return winStart + (pct / 100) * (winEnd - winStart);
}

//------------------------------------------------------------------------------
// Formatting
//------------------------------------------------------------------------------
export function fmtTs(ts: number, opts?: Intl.DateTimeFormatOptions): string {
    return new Date(ts * 1000).toLocaleString(
        undefined,
        opts ?? {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        },
    );
}

export function fmtDuration(seconds: number): string {
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    if (seconds < 86400) return m ? `${h}h ${m}m` : `${h}h`;
    const d = Math.floor(seconds / 86400);
    const hr = Math.round((seconds % 86400) / 3600);
    return hr ? `${d}d ${hr}h` : `${d}d`;
}
