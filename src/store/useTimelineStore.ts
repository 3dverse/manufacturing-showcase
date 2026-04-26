import { create } from "zustand";

//------------------------------------------------------------------------------
import { fetchSpan, spanWindow } from "@/core/Span";
import { scopeKey, workCenterIdsFromNode, mergeSpan, type TimelineSpan, type Window } from "@/core/Scope";
import { isArea, isLine, isCell, isMachine } from "@/core/SceneGraph";

//------------------------------------------------------------------------------
import type { SceneGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
// Types
//------------------------------------------------------------------------------

interface TimelineStore {
    span: TimelineSpan | null;
    loadedKeys: Set<string>;
    isLoading: boolean;
    loadSpan: (node: SceneGraphNode, siteId: string) => Promise<void>;
    window: Window; // Time window of the data set
    present: number; // Real-time "now", advancing with the wall clock
    setPresent: (t: number) => void;
    asOf: number | undefined; // Time the user has seeked to
    setAsOf: (t: number | undefined) => void;
    isPlaying: boolean;
    playbackSpeed: number; // virtual seconds advanced per real second (only affects asOf)
    play: () => void; // snaps present to actual now, then resumes ticking
    pause: () => void;
    setPlaybackSpeed: (speed: number) => void;
}

//------------------------------------------------------------------------------
// In-flight guard — one entry per concurrent fetch, no re-render needed
//------------------------------------------------------------------------------
const _activeKeys = new Set<string>();

// Always fetch at area level or above so navigating between cells/machines
// within the same area reuses the cached span.
function toAreaOrAbove(node: SceneGraphNode): SceneGraphNode {
    if (isLine(node)) return node.parent;
    if (isCell(node)) return isLine(node.parent) ? node.parent.parent : node.parent;
    if (isMachine(node)) {
        const cell = node.parent;
        return isLine(cell.parent) ? cell.parent.parent : cell.parent;
    }
    return node; // factory or area — already at the right level
}

//------------------------------------------------------------------------------
// Store
//------------------------------------------------------------------------------
const defaultWindow = spanWindow(Math.floor(Date.now() / 1000));

//------------------------------------------------------------------------------
export const useTimelineStore = create<TimelineStore>((set, get) => ({
    span: null,
    loadedKeys: new Set<string>(),
    isLoading: false,
    loadSpan: async (node, siteId) => {
        const window = get().window;

        const fetchNode = toAreaOrAbove(node);
        const wcKey = scopeKey(workCenterIdsFromNode(fetchNode));
        // WMS zone areas have no work centers — include the node hash to differentiate zones
        const nodeKey = wcKey === "" && isArea(fetchNode) ? fetchNode.hash : wcKey;
        const key = `${siteId}:${nodeKey}:${window.from}:${window.to}`;

        if (get().loadedKeys.has(key)) return; // already loaded, stays loaded
        if (_activeKeys.has(key)) return; // already in flight

        _activeKeys.add(key);
        set({ isLoading: true });

        try {
            const incoming = await fetchSpan(fetchNode, siteId, window);
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
    window: defaultWindow,
    present: defaultWindow.origin,
    setPresent: (t) => set({ present: t }),
    asOf: undefined,
    setAsOf: (t) => set({ asOf: t }),
    isPlaying: true,
    playbackSpeed: 1,
    play: () => set({ isPlaying: true, present: Math.floor(Date.now() / 1000) }),
    pause: () => set({ isPlaying: false }),
    setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
}));
