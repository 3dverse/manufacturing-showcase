import { create } from "zustand";

import { fetchSpan, spanWindow } from "@/core/Span";
import { scopeKey, workCenterIdsFromNode, mergeSpan, type TimelineSpan } from "@/core/Scope";
import { isArea, isLine, isCell, isMachine } from "@/core/NavGraph";
import type { NavGraphNode } from "@/content/type";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TimelineStore {
    // Span — accumulated across visited areas, invalidated on timespan change
    span: TimelineSpan | null;
    loadedKeys: Set<string>;
    isLoading: boolean;
    loadSpan: (node: NavGraphNode, siteId: string) => Promise<void>;

    // Playhead — pure UI, never triggers a fetch
    asOf: number;
    setAsOf: (t: number) => void;
}

// ---------------------------------------------------------------------------
// In-flight guard — one entry per concurrent fetch, no re-render needed
// ---------------------------------------------------------------------------

const _activeKeys = new Set<string>();

// Always fetch at area level or above so navigating between cells/machines
// within the same area reuses the cached span.
function toAreaOrAbove(node: NavGraphNode): NavGraphNode {
    if (isLine(node)) return node.parent;
    if (isCell(node)) return isLine(node.parent) ? node.parent.parent : node.parent;
    if (isMachine(node)) {
        const cell = node.parent;
        return isLine(cell.parent) ? cell.parent.parent : cell.parent;
    }
    return node; // factory or area — already at the right level
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useTimelineStore = create<TimelineStore>((set, get) => ({
    span: null,
    loadedKeys: new Set<string>(),
    isLoading: false,

    loadSpan: async (node, siteId) => {
        const { from, to } = spanWindow();
        const fetchNode = toAreaOrAbove(node);
        const wcKey = scopeKey(workCenterIdsFromNode(fetchNode));
        // WMS zone areas have no work centers — include the node hash to differentiate zones
        const nodeKey = wcKey === "" && isArea(fetchNode) ? fetchNode.hash : wcKey;
        const key = `${siteId}:${nodeKey}:${from}:${to}`;

        if (get().loadedKeys.has(key)) return; // already loaded, stays loaded
        if (_activeKeys.has(key)) return; // already in flight

        _activeKeys.add(key);
        set({ isLoading: true });

        try {
            const incoming = await fetchSpan(fetchNode, siteId, from, to);
            if (!_activeKeys.has(key)) return; // cancelled

            const existing = get().span;
            const merged = existing ? mergeSpan(existing, incoming) : incoming;
            const loadedKeys = new Set(get().loadedKeys);
            loadedKeys.add(key);
            set({ span: merged, loadedKeys });
        } catch {
            // ignore — isLoading cleared in finally
        } finally {
            _activeKeys.delete(key);
            set({ isLoading: _activeKeys.size > 0 });
        }
    },

    asOf: Math.floor(Date.now() / 1000),
    setAsOf: (t) => set({ asOf: t }),
}));
