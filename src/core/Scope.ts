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
    quantities: {
        plannedQuantity: number;
        uom: string;
        goodQuantity?: number;
        scrapQuantity?: number;
    };
    erpSalesOrderId?: string | null;
};

export type OperationEntry = {
    id: string;
    productionOrderId: string;
    workCenterId: string;
    operationCode: string;
    operationDescription?: string;
    sequence: number;
    status: string;
    scheduledStart: number;
    scheduledEnd: number;
    actualStart?: number;
    actualEnd?: number;
    progressPercent: number;
    quantities: {
        plannedQuantity: number;
        producedQuantity: number;
        goodQuantity: number;
        scrapQuantity: number;
        uom: string;
    };
    plannedRunTimeMinutes?: number;
    actualRunTimeMinutes?: number;
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
// Span — timespan-scoped cache
// ---------------------------------------------------------------------------

export type TimelineSpan = {
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

export function emptySpan(): TimelineSpan {
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
export function buildSpanIndexes(span: TimelineSpan): void {
    span.productionOrdersByLocation.clear();
    span.productionOrdersByWorkCenter.clear();
    span.operationsByWorkCenter.clear();
    span.downtimeByWorkCenter.clear();

    for (const po of span.productionOrders.values()) {
        appendIndex(span.productionOrdersByLocation, po.locationId, po.id);
    }

    for (const op of span.operations.values()) {
        appendIndex(span.operationsByWorkCenter, op.workCenterId, op.id);
        // A PO is "active on a work center" if any of its operations run there
        appendIndex(span.productionOrdersByWorkCenter, op.workCenterId, op.productionOrderId);
    }

    for (const dt of span.downtimeEvents.values()) {
        appendIndex(span.downtimeByWorkCenter, dt.workCenterId, dt.id);
    }
}

// ---------------------------------------------------------------------------
// Scope — node-scoped view derived from the span
// ---------------------------------------------------------------------------

export type TimelineLevel = "factory" | "area" | "line" | "cell" | "machine";

export type TimelineScope = {
    level: TimelineLevel;
    salesOrders: SalesOrderEntry[];
    productionOrders: ProductionOrderEntry[];
    operations: OperationEntry[];
    downtimeEvents: DowntimeEntry[];
    eamWorkOrders: WorkOrderEntry[];
};

/** Point-in-time view of a TimelineScope — same shape, filtered to asOf. */
export type AsOfSnapshot = TimelineScope;

/** Production order enriched with detail data from getProductionOrder. */
export type ProductionOrderDetailEntry = Omit<ProductionOrderEntry, "quantities"> & {
    quantities: {
        plannedQuantity: number;
        producedQuantity: number;
        goodQuantity: number;
        scrapQuantity: number;
        uom: string;
    };
    progressPercent: number;
    operationIds: string[];
    currentOperationId: string | null;
    notes?: string;
};

/**
 * Enriched snapshot — same as AsOfSnapshot but with full detail data fetched
 * for each production order and operation.
 */
export type RichSnapshot = Omit<AsOfSnapshot, "productionOrders" | "operations"> & {
    productionOrders: ProductionOrderDetailEntry[];
    operations: OperationEntry[];
};

// ---------------------------------------------------------------------------
// Scoping — pure function of (node, span), no async, no side effects
// ---------------------------------------------------------------------------

export function scopeFromNode(node: NavGraphNode, span: TimelineSpan): TimelineScope {
    if (isFactory(node)) return scopeFactory(node, span);
    if (isArea(node)) return scopeArea(node, span);
    if (isLine(node)) return scopeLine(node, span);
    if (isCell(node)) return scopeCell(node, span);
    if (isMachine(node)) return scopeMachine(node, span);
    return emptyScope("factory");
}

function scopeFactory(_node: FactoryNode, span: TimelineSpan): TimelineScope {
    return {
        level: "factory",
        salesOrders: Array.from(span.salesOrders.values()),
        productionOrders: [],
        operations: [],
        downtimeEvents: [],
        eamWorkOrders: [],
    };
}

function scopeArea(node: AreaNode, span: TimelineSpan): TimelineScope {
    return {
        level: "area",
        salesOrders: [],
        productionOrders: resolvePos(span.productionOrdersByLocation.get(node.hash), span),
        operations: [],
        downtimeEvents: [],
        eamWorkOrders: [],
    };
}

function scopeLine(node: LineNode, span: TimelineSpan): TimelineScope {
    const cellHashes = node.cells.map((c) => c.hash);
    const poIds = cellHashes.flatMap((h) => span.productionOrdersByWorkCenter.get(h) ?? []);
    const opIds = cellHashes.flatMap((h) => span.operationsByWorkCenter.get(h) ?? []);
    const dtIds = cellHashes.flatMap((h) => span.downtimeByWorkCenter.get(h) ?? []);
    return {
        level: "line",
        salesOrders: [],
        productionOrders: resolveUnique(poIds, span.productionOrders),
        operations: resolveUnique(opIds, span.operations),
        downtimeEvents: resolveUnique(dtIds, span.downtimeEvents),
        eamWorkOrders: [],
    };
}

function scopeCell(node: CellNode, span: TimelineSpan): TimelineScope {
    return {
        level: "cell",
        salesOrders: [],
        productionOrders: resolvePos(span.productionOrdersByWorkCenter.get(node.hash), span),
        operations: resolveOps(span.operationsByWorkCenter.get(node.hash), span),
        downtimeEvents: resolveDowntimes(span.downtimeByWorkCenter.get(node.hash), span),
        eamWorkOrders: [],
    };
}

function scopeMachine(node: MachineNode, span: TimelineSpan): TimelineScope {
    // Operations and production orders are work-center-scoped, not machine-scoped
    const wcId = node.parent.hash;
    return {
        level: "machine",
        salesOrders: [],
        productionOrders: resolvePos(span.productionOrdersByWorkCenter.get(wcId), span),
        operations: resolveOps(span.operationsByWorkCenter.get(wcId), span),
        downtimeEvents: resolveDowntimes(span.downtimeByWorkCenter.get(wcId), span),
        eamWorkOrders: span.eamWorkOrdersByAsset.get(node.hash) ?? [],
    };
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Resolve helpers
// ---------------------------------------------------------------------------

function resolvePos(ids: string[] | undefined, span: TimelineSpan): ProductionOrderEntry[] {
    return resolveUnique(ids ?? [], span.productionOrders);
}

function resolveOps(ids: string[] | undefined, span: TimelineSpan): OperationEntry[] {
    if (!ids) return [];
    return ids.flatMap((id) => {
        const op = span.operations.get(id);
        return op ? [op] : [];
    });
}

function resolveDowntimes(ids: string[] | undefined, span: TimelineSpan): DowntimeEntry[] {
    if (!ids) return [];
    return ids.flatMap((id) => {
        const dt = span.downtimeEvents.get(id);
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
        return [...node.lines.flatMap((l) => l.cells.map((c) => c.hash)), ...node.cells.map((c) => c.hash)];
    if (isLine(node)) return node.cells.map((c) => c.hash);
    if (isCell(node)) return [node.hash];
    if (isMachine(node)) return [node.parent.hash];
    return [];
}

export function locationIdsFromNode(node: NavGraphNode): string[] {
    if (isFactory(node)) return node.areas.map((a) => a.hash);
    if (isArea(node)) return [node.hash];
    if (isLine(node)) return [node.parent.hash];
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
    if (isLine(node)) return node.cells.flatMap((c) => c.machines.map((m) => m.hash));
    if (isCell(node)) return node.machines.map((m) => m.hash);
    if (isMachine(node)) return [node.hash];
    return [];
}

/** Stable cache / query key for a set of work center IDs. */
export function scopeKey(workCenterIds: string[]): string {
    return [...workCenterIds].sort().join(",");
}

export function levelFromNode(node: NavGraphNode): TimelineLevel {
    if (isFactory(node)) return "factory";
    if (isArea(node)) return "area";
    if (isLine(node)) return "line";
    if (isCell(node)) return "cell";
    return "machine";
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function appendIndex<K, V>(map: Map<K, V[]>, key: K, value: V): void {
    const arr = map.get(key);
    if (arr) arr.push(value);
    else map.set(key, [value]);
}

function emptyScope(level: TimelineLevel): TimelineScope {
    return { level, salesOrders: [], productionOrders: [], operations: [], downtimeEvents: [], eamWorkOrders: [] };
}
