import { create } from "zustand";

import { fetchPODetail, fetchOpDetail } from "@/core/Detail";
import type { AsOfSnapshot, ProductionOrderDetailEntry, OperationEntry } from "@/core/Scope";

// ---------------------------------------------------------------------------
// In-flight dedup — module-level so it survives store resets
// ---------------------------------------------------------------------------

const _inFlightPO  = new Set<string>();
const _inFlightOp  = new Set<string>();

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface DetailStore {
    poCache:    Map<string, ProductionOrderDetailEntry>;
    opCache:    Map<string, OperationEntry>;
    isLoading:  boolean;
    loadDetails(snapshot: AsOfSnapshot, siteId: string): Promise<void>;
}

export const useDetailStore = create<DetailStore>((set, get) => ({
    poCache:   new Map(),
    opCache:   new Map(),
    isLoading: false,

    async loadDetails(snapshot, siteId) {
        const { poCache, opCache } = get();

        const missingPOs = snapshot.productionOrders
            .map((po) => po.id)
            .filter((id) => !poCache.has(id) && !_inFlightPO.has(id));

        const missingOps = snapshot.operations
            .map((op) => op.id)
            .filter((id) => !opCache.has(id) && !_inFlightOp.has(id));

        if (missingPOs.length === 0 && missingOps.length === 0) return;

        missingPOs.forEach((id) => _inFlightPO.add(id));
        missingOps.forEach((id) => _inFlightOp.add(id));
        set({ isLoading: true });

        const [poResults, opResults] = await Promise.all([
            Promise.all(missingPOs.map((id) => fetchPODetail(id, siteId))),
            Promise.all(missingOps.map((id) => fetchOpDetail(id, siteId))),
        ]);

        const newPoCache = new Map(get().poCache);
        for (const po of poResults) {
            newPoCache.set(po.id, po);
            _inFlightPO.delete(po.id);
        }

        const newOpCache = new Map(get().opCache);
        for (const op of opResults) {
            newOpCache.set(op.id, op);
            _inFlightOp.delete(op.id);
        }

        set({ poCache: newPoCache, opCache: newOpCache, isLoading: false });
    },
}));
