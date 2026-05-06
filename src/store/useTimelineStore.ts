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

export type ZoomKey = "1D" | "1W" | "2W" | "1M" | "3M" | "6M";

export type TimelineWindow = { kind: "zoom"; key: ZoomKey } | { kind: "custom"; from: number; to: number };

interface TimelineStore {
    nodeListBySiteId: Map<string, SceneGraphNode[]>;
    setNodeList: (siteId: string, list: SceneGraphNode[]) => void;
    span: TimelineSpan | null;
    loadedKeys: Set<string>;
    isLoading: boolean;
    loadSpan: (siteId: string, node?: SceneGraphNode) => Promise<void>;
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
    timelineWindow: TimelineWindow;
    setZoom: (key: ZoomKey) => void;
    setCustomWindow: (from: number, to: number) => void;
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
    nodeListBySiteId: new Map(),
    setNodeList: (siteId, list) => set((s) => ({ nodeListBySiteId: new Map(s.nodeListBySiteId).set(siteId, list) })),
    span: null,
    loadedKeys: new Set<string>(),
    isLoading: false,
    loadSpan: async (siteId, node?) => {
        const window = get().window;

        let fetchNode: SceneGraphNode | undefined;
        let nodeKey: string;
        if (node) {
            fetchNode = toAreaOrAbove(node);
            const wcKey = scopeKey(workCenterIdsFromNode(fetchNode));
            // WMS zone areas have no work centers — include the node hash to differentiate zones
            nodeKey = wcKey === "" && isArea(fetchNode) ? fetchNode.hash : wcKey;
        } else {
            fetchNode = undefined;
            nodeKey = "factory";
        }
        const key = `${siteId}:${nodeKey}:${window.from}:${window.to}`;

        if (get().loadedKeys.has(key)) return; // already loaded, stays loaded
        if (_activeKeys.has(key)) return; // already in flight

        _activeKeys.add(key);
        set({ isLoading: true });

        try {
            const incoming = await fetchSpan(siteId, window, fetchNode);
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
    timelineWindow: { kind: "zoom", key: "1W" },
    setZoom: (key) => set({ timelineWindow: { kind: "zoom", key } }),
    setCustomWindow: (from, to) => set({ timelineWindow: { kind: "custom", from, to } }),
}));
