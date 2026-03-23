import type { NavGraphNode, FactoryNode, AreaNode, LineNode, CellNode, MachineNode } from "@/content/type";
import { isArea, isCell, isFactory, isLine, isMachine } from "./NavGraph";

// ---------------------------------------------------------------------------
// Entry types
// ---------------------------------------------------------------------------

export type SalesOrderEntry = {
    id: string;
    orderNumber: string;
    customerId: string;
    status: string;
    orderDate: number;
    requestedDeliveryDate: number;
    siteId: string;
};

export type ProductionOrderEntry = {
    id: string;
    orderNumber: string;
    locationId: string;
    itemCode: string;
    status: string;
    timing: {
        scheduledStart: number;
        scheduledEnd: number;
        actualStart?: number;
        actualEnd?: number;
    };
    erpSalesOrderId?: string | null;
};

export type OperationEntry = {
    id: string;
    productionOrderId: string;
    workCenterId: string;
    operationCode: string;
    sequence: number;
    status: string;
    scheduledStart: number;
    scheduledEnd: number;
    actualStart?: number;
    actualEnd?: number;
};

export type DowntimeEntry = {
    id: string;
    workCenterId: string;
    startedAt: number;
    endedAt?: number;
    reasonCode: string;
    reasonDescription?: string;
    productionOrderId?: string;
};

export type WorkOrderEntry = {
    id: string;
    workOrderNumber: string;
    workType: "preventive" | "corrective" | string;
    status: string;
    assetId: string;
    scheduledStart: number;
    scheduledEnd: number;
    actualStart?: number;
    actualEnd?: number;
    mesProductionOrderId?: string | null;
};

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

export type TimelineCache = {
    // Layer 1 — site-wide bulk (invalidated on timespan change)
    salesOrders: Map<string, SalesOrderEntry>;
    productionOrders: Map<string, ProductionOrderEntry>;
    operations: Map<string, OperationEntry>;
    downtimeEvents: Map<string, DowntimeEntry>;
    // Indexes built from the above
    productionOrdersByLocation: Map<string, string[]>;
    productionOrdersByWorkCenter: Map<string, string[]>;
    operationsByWorkCenter: Map<string, string[]>;
    downtimeByWorkCenter: Map<string, string[]>;
    // Layer 2 — per machine, fetched on first visit
    eamWorkOrdersByAsset: Map<string, WorkOrderEntry[]>;
};

export function emptyCache(): TimelineCache {
    return {
        salesOrders: new Map(),
        productionOrders: new Map(),
        operations: new Map(),
        downtimeEvents: new Map(),
        productionOrdersByLocation: new Map(),
        productionOrdersByWorkCenter: new Map(),
        operationsByWorkCenter: new Map(),
        downtimeByWorkCenter: new Map(),
        eamWorkOrdersByAsset: new Map(),
    };
}

/**
 * Build all secondary indexes from the flat Maps.
 * Call this once after populating salesOrders / productionOrders / operations /
 * downtimeEvents from API responses.
 */
export function buildCacheIndexes(cache: TimelineCache): void {
    cache.productionOrdersByLocation.clear();
    cache.productionOrdersByWorkCenter.clear();
    cache.operationsByWorkCenter.clear();
    cache.downtimeByWorkCenter.clear();

    for (const po of cache.productionOrders.values()) {
        appendIndex(cache.productionOrdersByLocation, po.locationId, po.id);
    }

    for (const op of cache.operations.values()) {
        appendIndex(cache.operationsByWorkCenter, op.workCenterId, op.id);
        // A PO is "active on a work center" if any of its operations run there
        appendIndex(cache.productionOrdersByWorkCenter, op.workCenterId, op.productionOrderId);
    }

    for (const dt of cache.downtimeEvents.values()) {
        appendIndex(cache.downtimeByWorkCenter, dt.workCenterId, dt.id);
    }
}

// ---------------------------------------------------------------------------
// Scoped state
// ---------------------------------------------------------------------------

export type TimelineLevel = "factory" | "area" | "line" | "cell" | "machine";

export type ScopedTimelineState = {
    level: TimelineLevel;
    salesOrders: SalesOrderEntry[];
    productionOrders: ProductionOrderEntry[];
    operations: OperationEntry[];
    downtimeEvents: DowntimeEntry[];
    eamWorkOrders: WorkOrderEntry[];
};

// ---------------------------------------------------------------------------
// Scoping — pure function of (node, cache), no async, no side effects
// ---------------------------------------------------------------------------

export function scopeFromNode(node: NavGraphNode, cache: TimelineCache): ScopedTimelineState {
    if (isFactory(node)) return scopeFactory(node, cache);
    if (isArea(node))    return scopeArea(node, cache);
    if (isLine(node))    return scopeLine(node, cache);
    if (isCell(node))    return scopeCell(node, cache);
    if (isMachine(node)) return scopeMachine(node, cache);
    return emptyState("factory");
}

function scopeFactory(_node: FactoryNode, cache: TimelineCache): ScopedTimelineState {
    return {
        level: "factory",
        salesOrders: Array.from(cache.salesOrders.values()),
        productionOrders: [],
        operations: [],
        downtimeEvents: [],
        eamWorkOrders: [],
    };
}

function scopeArea(node: AreaNode, cache: TimelineCache): ScopedTimelineState {
    return {
        level: "area",
        salesOrders: [],
        productionOrders: resolvePos(cache.productionOrdersByLocation.get(node.hash), cache),
        operations: [],
        downtimeEvents: [],
        eamWorkOrders: [],
    };
}

function scopeLine(node: LineNode, cache: TimelineCache): ScopedTimelineState {
    const cellHashes = node.cells.map((c) => c.hash);
    const poIds = cellHashes.flatMap((h) => cache.productionOrdersByWorkCenter.get(h) ?? []);
    const opIds = cellHashes.flatMap((h) => cache.operationsByWorkCenter.get(h) ?? []);
    const dtIds = cellHashes.flatMap((h) => cache.downtimeByWorkCenter.get(h) ?? []);
    return {
        level: "line",
        salesOrders: [],
        productionOrders: resolveUnique(poIds, cache.productionOrders),
        operations: resolveUnique(opIds, cache.operations),
        downtimeEvents: resolveUnique(dtIds, cache.downtimeEvents),
        eamWorkOrders: [],
    };
}

function scopeCell(node: CellNode, cache: TimelineCache): ScopedTimelineState {
    return {
        level: "cell",
        salesOrders: [],
        productionOrders: resolvePos(cache.productionOrdersByWorkCenter.get(node.hash), cache),
        operations: resolveOps(cache.operationsByWorkCenter.get(node.hash), cache),
        downtimeEvents: resolveDowntimes(cache.downtimeByWorkCenter.get(node.hash), cache),
        eamWorkOrders: [],
    };
}

function scopeMachine(node: MachineNode, cache: TimelineCache): ScopedTimelineState {
    // Operations and production orders are work-center-scoped, not machine-scoped
    const wcId = node.parent.hash;
    return {
        level: "machine",
        salesOrders: [],
        productionOrders: resolvePos(cache.productionOrdersByWorkCenter.get(wcId), cache),
        operations: resolveOps(cache.operationsByWorkCenter.get(wcId), cache),
        downtimeEvents: resolveDowntimes(cache.downtimeByWorkCenter.get(wcId), cache),
        eamWorkOrders: cache.eamWorkOrdersByAsset.get(node.hash) ?? [],
    };
}

// ---------------------------------------------------------------------------
// Phase classification — asOf-dependent, kept separate from scoping so it
// can be called at render time without re-scoping
// ---------------------------------------------------------------------------

export type Phase = "completed" | "active" | "future";

export function classifyPhase(timing: ProductionOrderEntry["timing"], asOf: number): Phase {
    const { actualEnd, actualStart, scheduledStart } = timing;
    if (actualEnd !== undefined && actualEnd <= asOf) return "completed";
    if ((actualStart !== undefined && actualStart <= asOf) || scheduledStart <= asOf) return "active";
    return "future";
}

// ---------------------------------------------------------------------------
// Resolve helpers
// ---------------------------------------------------------------------------

function resolvePos(ids: string[] | undefined, cache: TimelineCache): ProductionOrderEntry[] {
    return resolveUnique(ids ?? [], cache.productionOrders);
}

function resolveOps(ids: string[] | undefined, cache: TimelineCache): OperationEntry[] {
    if (!ids) return [];
    return ids.flatMap((id) => {
        const op = cache.operations.get(id);
        return op ? [op] : [];
    });
}

function resolveDowntimes(ids: string[] | undefined, cache: TimelineCache): DowntimeEntry[] {
    if (!ids) return [];
    return ids.flatMap((id) => {
        const dt = cache.downtimeEvents.get(id);
        return dt ? [dt] : [];
    });
}

/** Resolve a list of IDs against a Map, deduplicating in insertion order. */
function resolveUnique<T>(ids: string[], map: Map<string, T>): T[] {
    const seen = new Set<string>();
    const result: T[] = [];
    for (const id of ids) {
        if (seen.has(id)) continue;
        seen.add(id);
        const entry = map.get(id);
        if (entry) result.push(entry);
    }
    return result;
}

// ---------------------------------------------------------------------------
// Navigation helpers — used by the fetch layer to determine what to request
// ---------------------------------------------------------------------------

export function workCenterIdsFromNode(node: NavGraphNode): string[] {
    if (isFactory(node))
        return node.areas.flatMap((a) => [
            ...a.lines.flatMap((l) => l.cells.map((c) => c.hash)),
            ...a.cells.map((c) => c.hash),
        ]);
    if (isArea(node))
        return [
            ...node.lines.flatMap((l) => l.cells.map((c) => c.hash)),
            ...node.cells.map((c) => c.hash),
        ];
    if (isLine(node))  return node.cells.map((c) => c.hash);
    if (isCell(node))  return [node.hash];
    if (isMachine(node)) return [node.parent.hash];
    return [];
}

export function locationIdsFromNode(node: NavGraphNode): string[] {
    if (isFactory(node)) return node.areas.map((a) => a.hash);
    if (isArea(node))    return [node.hash];
    if (isLine(node))    return [node.parent.hash];
    if (isCell(node)) {
        const p = node.parent;
        return [isLine(p) ? p.parent.hash : p.hash];
    }
    if (isMachine(node)) {
        const p = node.parent.parent;
        return [isLine(p) ? p.parent.hash : p.hash];
    }
    return [];
}

export function machineHashesFromNode(node: NavGraphNode): string[] {
    if (isFactory(node))
        return node.areas.flatMap((a) => [
            ...a.lines.flatMap((l) => l.cells.flatMap((c) => c.machines.map((m) => m.hash))),
            ...a.cells.flatMap((c) => c.machines.map((m) => m.hash)),
        ]);
    if (isArea(node))
        return [
            ...node.lines.flatMap((l) => l.cells.flatMap((c) => c.machines.map((m) => m.hash))),
            ...node.cells.flatMap((c) => c.machines.map((m) => m.hash)),
        ];
    if (isLine(node))    return node.cells.flatMap((c) => c.machines.map((m) => m.hash));
    if (isCell(node))    return node.machines.map((m) => m.hash);
    if (isMachine(node)) return [node.hash];
    return [];
}

/** Stable cache / query key for a set of work center IDs. */
export function scopeKey(workCenterIds: string[]): string {
    return [...workCenterIds].sort().join(",");
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function appendIndex<K, V>(map: Map<K, V[]>, key: K, value: V): void {
    const arr = map.get(key);
    if (arr) arr.push(value);
    else map.set(key, [value]);
}

function emptyState(level: TimelineLevel): ScopedTimelineState {
    return { level, salesOrders: [], productionOrders: [], operations: [], downtimeEvents: [], eamWorkOrders: [] };
}
