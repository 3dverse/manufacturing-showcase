import type { AsOfProjection } from "@/core/Projection";

// ---------------------------------------------------------------------------
// Entity types
// ---------------------------------------------------------------------------

export type EntityType = "salesOrder" | "productionOrder" | "operation" | "downtime" | "workOrder";

export type FocusedEntity = { type: EntityType; id: string };

export type HighlightState = "focused" | "correlated" | "dimmed" | "idle";

// ---------------------------------------------------------------------------
// Correlation index — reverse-lookup maps built from a full projection
// ---------------------------------------------------------------------------

export type CorrelationIndex = {
    /** SO id → set of PO ids linked via erpSalesOrderId */
    soToPos: Map<string, Set<string>>;
    /** PO id → SO id (if any) */
    poToSo: Map<string, string>;
    /** PO id → set of operation ids */
    poToOps: Map<string, Set<string>>;
    /** operation id → PO id */
    opToPo: Map<string, string>;
    /** PO id → set of downtime ids linked via productionOrderId */
    poToDowntimes: Map<string, Set<string>>;
    /** downtime id → PO id (if any) */
    downtimeToPo: Map<string, string>;
    /** PO id → set of work order ids linked via mesProductionOrderId */
    poToWorkOrders: Map<string, Set<string>>;
    /** work order id → PO id (if any) */
    workOrderToPo: Map<string, string>;
};

export function buildCorrelationIndex(projection: AsOfProjection): CorrelationIndex {
    const soToPos = new Map<string, Set<string>>();
    const poToSo = new Map<string, string>();
    const poToOps = new Map<string, Set<string>>();
    const opToPo = new Map<string, string>();
    const poToDowntimes = new Map<string, Set<string>>();
    const downtimeToPo = new Map<string, string>();
    const poToWorkOrders = new Map<string, Set<string>>();
    const workOrderToPo = new Map<string, string>();

    for (const po of projection.productionOrders) {
        if (po.erpSalesOrderId) {
            poToSo.set(po.id, po.erpSalesOrderId);
            addToSet(soToPos, po.erpSalesOrderId, po.id);
        }
    }

    for (const op of projection.operations) {
        opToPo.set(op.id, op.productionOrderId);
        addToSet(poToOps, op.productionOrderId, op.id);
    }

    for (const dt of projection.downtimeEvents) {
        if (dt.productionOrderId) {
            downtimeToPo.set(dt.id, dt.productionOrderId);
            addToSet(poToDowntimes, dt.productionOrderId, dt.id);
        }
    }

    for (const wo of projection.eamWorkOrders) {
        if (wo.mesProductionOrderId) {
            workOrderToPo.set(wo.id, wo.mesProductionOrderId);
            addToSet(poToWorkOrders, wo.mesProductionOrderId, wo.id);
        }
    }

    return { soToPos, poToSo, poToOps, opToPo, poToDowntimes, downtimeToPo, poToWorkOrders, workOrderToPo };
}

// ---------------------------------------------------------------------------
// Correlated set — all entities linked to a focused one
// ---------------------------------------------------------------------------

export type CorrelatedSet = {
    salesOrders: Set<string>;
    productionOrders: Set<string>;
    operations: Set<string>;
    downtimeEvents: Set<string>;
    eamWorkOrders: Set<string>;
};

export function correlate(focused: FocusedEntity, index: CorrelationIndex): CorrelatedSet {
    const salesOrders = new Set<string>();
    const productionOrders = new Set<string>();
    const operations = new Set<string>();
    const downtimeEvents = new Set<string>();
    const eamWorkOrders = new Set<string>();

    // Resolve the set of PO ids that are the pivot for this focus
    const pivotPoIds = new Set<string>();

    switch (focused.type) {
        case "salesOrder": {
            salesOrders.add(focused.id);
            for (const poId of index.soToPos.get(focused.id) ?? []) pivotPoIds.add(poId);
            break;
        }
        case "productionOrder": {
            productionOrders.add(focused.id);
            pivotPoIds.add(focused.id);
            const soId = index.poToSo.get(focused.id);
            if (soId) salesOrders.add(soId);
            break;
        }
        case "operation": {
            operations.add(focused.id);
            const poId = index.opToPo.get(focused.id);
            if (poId) {
                pivotPoIds.add(poId);
                productionOrders.add(poId);
                const soId = index.poToSo.get(poId);
                if (soId) salesOrders.add(soId);
            }
            break;
        }
        case "downtime": {
            downtimeEvents.add(focused.id);
            const poId = index.downtimeToPo.get(focused.id);
            if (poId) {
                pivotPoIds.add(poId);
                productionOrders.add(poId);
                const soId = index.poToSo.get(poId);
                if (soId) salesOrders.add(soId);
            }
            break;
        }
        case "workOrder": {
            eamWorkOrders.add(focused.id);
            const poId = index.workOrderToPo.get(focused.id);
            if (poId) {
                pivotPoIds.add(poId);
                productionOrders.add(poId);
                const soId = index.poToSo.get(poId);
                if (soId) salesOrders.add(soId);
            }
            break;
        }
    }

    // Expand pivot POs to themselves and all linked entities
    for (const poId of pivotPoIds) {
        productionOrders.add(poId);
        for (const opId of index.poToOps.get(poId) ?? []) operations.add(opId);
        for (const dtId of index.poToDowntimes.get(poId) ?? []) downtimeEvents.add(dtId);
        for (const woId of index.poToWorkOrders.get(poId) ?? []) eamWorkOrders.add(woId);
    }

    return { salesOrders, productionOrders, operations, downtimeEvents, eamWorkOrders };
}

// ---------------------------------------------------------------------------
// Highlight state — per-bar classification
// ---------------------------------------------------------------------------

export function highlightStateForBar(
    id: string,
    type: EntityType,
    focused: FocusedEntity | null,
    correlated: CorrelatedSet | null,
): HighlightState {
    if (!focused || !correlated) return "idle";
    if (focused.id === id && focused.type === type) return "focused";

    const set = entitySet(type, correlated);
    if (set.has(id)) return "correlated";
    return "dimmed";
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function addToSet<K, V>(map: Map<K, Set<V>>, key: K, value: V): void {
    const s = map.get(key);
    if (s) s.add(value);
    else map.set(key, new Set([value]));
}

function entitySet(type: EntityType, correlated: CorrelatedSet): Set<string> {
    switch (type) {
        case "salesOrder":    return correlated.salesOrders;
        case "productionOrder": return correlated.productionOrders;
        case "operation":     return correlated.operations;
        case "downtime":      return correlated.downtimeEvents;
        case "workOrder":     return correlated.eamWorkOrders;
    }
}
