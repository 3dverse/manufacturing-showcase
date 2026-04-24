import { useEffect, useMemo } from "react";
//------------------------------------------------------------------------------

import { useFactoryStore } from "@/store/useFactoryStore";
import { useTimelineStore } from "@/store/useTimelineStore";
import { scopeFromNode, levelFromNode, type TimelineScope, type TimelineLevel } from "@/core/Scope";

//------------------------------------------------------------------------------
import type { SceneGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export function useScope(node: SceneGraphNode | null): {
    scope: TimelineScope | null;
    level: TimelineLevel | null;
    isLoading: boolean;
} {
    const siteId = useFactoryStore((s) => s.currentFactory?.scene_id ?? "");
    const span = useTimelineStore((s) => s.span);
    const isLoading = useTimelineStore((s) => s.isLoading);
    const loadSpan = useTimelineStore((s) => s.loadSpan);

    useEffect(() => {
        if (node && siteId) loadSpan(node, siteId);
    }, [node, siteId, loadSpan]);

    const scope = useMemo(() => (node && span ? scopeFromNode(node, span) : null), [node, span]);

    // Derive level independently so it's available during loading (before scope
    // arrives) — keeps the Timeline layout stable with no height flicker.
    const level = useMemo(() => scope?.level ?? (node ? levelFromNode(node) : null), [scope, node]);

    return { scope, level, isLoading };
}
