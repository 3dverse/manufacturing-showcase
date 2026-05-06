//------------------------------------------------------------------------------
export type VideoPresentation =
    | { kind: "youtube"; embedUrl: string }
    | { kind: "direct"; src: string }
    | { kind: "link"; href: string };

//------------------------------------------------------------------------------
export function resolveVideoPresentation(url: string): VideoPresentation {
    const trimmed = url.trim();
    try {
        const u = new URL(trimmed);
        const host = u.hostname.replace(/^www\./, "");
        if (host === "youtube.com" || host === "m.youtube.com") {
            const v = u.searchParams.get("v");
            if (v) return { kind: "youtube", embedUrl: `https://www.youtube.com/embed/${v}` };
        }
        if (host === "youtu.be") {
            const id = u.pathname.replace(/^\//, "").split("/")[0];
            if (id) return { kind: "youtube", embedUrl: `https://www.youtube.com/embed/${id}` };
        }
    } catch {
        /* ignore */
    }
    if (/\.(mp4|webm|ogg)(\?|$)/i.test(trimmed)) return { kind: "direct", src: trimmed };
    return { kind: "link", href: trimmed };
}

//------------------------------------------------------------------------------
export function fmtHistoryDate(d: Date): string {
    return d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}
