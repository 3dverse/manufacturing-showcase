import { create } from "zustand";

import { fetchSpan, spanWindow } from "@/core/Span";
import { scopeKey, workCenterIdsFromNode, type TimelineSpan } from "@/core/Scope";
import { isArea } from "@/core/NavGraph";
import type { NavGraphNode } from "@/content/type";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TimelineStore {
    // Span — fetched from APIs, invalidated on node/timespan change
    span:      TimelineSpan | null;
    spanKey:   string | null;
    isLoading: boolean;
    loadSpan:  (node: NavGraphNode, siteId: string) => Promise<void>;

    // Playhead — pure UI, never triggers a fetch
    asOf:    number;
    setAsOf: (t: number) => void;
}

// ---------------------------------------------------------------------------
// In-flight guard — prevents duplicate fetches without storing it in state
// (no re-render needed for this internal detail)
// ---------------------------------------------------------------------------

let _activeKey: string | null = null;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useTimelineStore = create<TimelineStore>((set, get) => ({
    span:      null,
    spanKey:   null,
    isLoading: false,

    loadSpan: async (node, siteId) => {
        const { from, to } = spanWindow();
        const wcKey = scopeKey(workCenterIdsFromNode(node));
        // WMS zone areas have no work centers — include the node hash to differentiate zones
        const nodeKey = wcKey === "" && isArea(node) ? node.hash : wcKey;
        const key = `${siteId}:${nodeKey}:${from}:${to}`;

        if (get().spanKey === key) return; // cache hit
        if (_activeKey === key)    return; // already in flight

        _activeKey = key;
        set({ isLoading: true });

        try {
            const span = await fetchSpan(node, siteId, from, to);
            if (_activeKey === key) set({ span, spanKey: key, isLoading: false });
        } catch {
            if (_activeKey === key) set({ isLoading: false });
        } finally {
            if (_activeKey === key) _activeKey = null;
        }
    },

    asOf:    Math.floor(Date.now() / 1000),
    setAsOf: (t) => set({ asOf: t }),
}));
