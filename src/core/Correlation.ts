import type { AsOfProjection } from "@/core/Projection";

// ---------------------------------------------------------------------------
// Entity types
// ---------------------------------------------------------------------------

export type EntityType =
    | "salesOrder"
    | "productionOrder"
    | "operation"
    | "downtime"
    | "workOrder"
    | "pickTask"
    | "receipt"
    | "putawayTask"
    | "purchaseOrder"
    | "allocation";

export type FocusedEntity = { type: EntityType; id: string };

const ID_PREFIX_TO_ENTITY_TYPE: Record<string, EntityType> = {
    SO: "salesOrder",
    MO: "productionOrder",
    OP: "operation",
    DT: "downtime",
    WO: "workOrder",
    PICK: "pickTask",
    RCP: "receipt",
    PUT: "putawayTask",
    PO: "purchaseOrder",
    ALLOC: "allocation",
};

export function entityTypeFromId(id: string): EntityType | null {
    const prefix = id.match(/^[A-Z]+/)?.[0];
    return prefix ? (ID_PREFIX_TO_ENTITY_TYPE[prefix] ?? null) : null;
}

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
    /** SO id → set of pick task ids linked via salesOrderId */
    soToPickTasks: Map<string, Set<string>>;
    /** pick task id → SO id (if any) */
    pickTaskToSo: Map<string, string>;
    /** receipt id → set of putaway task ids */
    receiptToPutawayTasks: Map<string, Set<string>>;
    /** putaway task id → receipt id (if any) */
    putawayTaskToReceipt: Map<string, string>;
    /** ERP purchase order id → set of receipt ids */
    erpPoToReceipts: Map<string, Set<string>>;
    /** receipt id → ERP purchase order id (if any) */
    receiptToErpPo: Map<string, string>;
    /** PO id → set of allocation ids (demand_type = production_order) */
    poToAllocations: Map<string, Set<string>>;
    /** allocation id → PO id (if any) */
    allocToPo: Map<string, string>;
    /** SO id → set of allocation ids (demand_type = sales_order) */
    soToAllocations: Map<string, Set<string>>;
    /** allocation id → SO id (if any) */
    allocToSo: Map<string, string>;
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
    const soToPickTasks = new Map<string, Set<string>>();
    const pickTaskToSo = new Map<string, string>();
    const receiptToPutawayTasks = new Map<string, Set<string>>();
    const putawayTaskToReceipt = new Map<string, string>();
    const erpPoToReceipts = new Map<string, Set<string>>();
    const receiptToErpPo = new Map<string, string>();
    const poToAllocations = new Map<string, Set<string>>();
    const allocToPo = new Map<string, string>();
    const soToAllocations = new Map<string, Set<string>>();
    const allocToSo = new Map<string, string>();

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

    for (const pt of projection.pickTasks) {
        if (pt.salesOrderId) {
            pickTaskToSo.set(pt.id, pt.salesOrderId);
            addToSet(soToPickTasks, pt.salesOrderId, pt.id);
        }
    }

    for (const put of projection.putawayTasks) {
        if (put.receiptId) {
            putawayTaskToReceipt.set(put.id, put.receiptId);
            addToSet(receiptToPutawayTasks, put.receiptId, put.id);
        }
    }

    for (const r of projection.receipts) {
        if (r.erpPurchaseOrderId) {
            receiptToErpPo.set(r.id, r.erpPurchaseOrderId);
            addToSet(erpPoToReceipts, r.erpPurchaseOrderId, r.id);
        }
    }

    for (const alloc of projection.allocations) {
        if (alloc.demandType === "production_order" && alloc.productionOrderId) {
            allocToPo.set(alloc.id, alloc.productionOrderId);
            addToSet(poToAllocations, alloc.productionOrderId, alloc.id);
        }
        if (alloc.erpSalesOrderId) {
            allocToSo.set(alloc.id, alloc.erpSalesOrderId);
            addToSet(soToAllocations, alloc.erpSalesOrderId, alloc.id);
        }
    }

    return {
        soToPos,
        poToSo,
        poToOps,
        opToPo,
        poToDowntimes,
        downtimeToPo,
        poToWorkOrders,
        workOrderToPo,
        soToPickTasks,
        pickTaskToSo,
        receiptToPutawayTasks,
        putawayTaskToReceipt,
        erpPoToReceipts,
        receiptToErpPo,
        poToAllocations,
        allocToPo,
        soToAllocations,
        allocToSo,
    };
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
    pickTasks: Set<string>;
    receipts: Set<string>;
    putawayTasks: Set<string>;
    purchaseOrders: Set<string>;
    allocations: Set<string>;
};

export function correlate(focused: FocusedEntity, index: CorrelationIndex): CorrelatedSet {
    const salesOrders = new Set<string>();
    const productionOrders = new Set<string>();
    const operations = new Set<string>();
    const downtimeEvents = new Set<string>();
    const eamWorkOrders = new Set<string>();
    const pickTasks = new Set<string>();
    const receipts = new Set<string>();
    const putawayTasks = new Set<string>();
    const purchaseOrders = new Set<string>();
    const allocations = new Set<string>();

    // Resolve the set of PO ids that are the pivot for this focus
    const pivotPoIds = new Set<string>();

    switch (focused.type) {
        case "salesOrder": {
            salesOrders.add(focused.id);
            for (const poId of index.soToPos.get(focused.id) ?? []) pivotPoIds.add(poId);
            for (const ptId of index.soToPickTasks.get(focused.id) ?? []) pickTasks.add(ptId);
            for (const aId of index.soToAllocations.get(focused.id) ?? []) allocations.add(aId);
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
        case "pickTask": {
            pickTasks.add(focused.id);
            const soId = index.pickTaskToSo.get(focused.id);
            if (soId) salesOrders.add(soId);
            break;
        }
        case "receipt": {
            receipts.add(focused.id);
            for (const putId of index.receiptToPutawayTasks.get(focused.id) ?? []) putawayTasks.add(putId);
            const erpPoId = index.receiptToErpPo.get(focused.id);
            if (erpPoId) purchaseOrders.add(erpPoId);
            break;
        }
        case "putawayTask": {
            putawayTasks.add(focused.id);
            const rcptId = index.putawayTaskToReceipt.get(focused.id);
            if (rcptId) {
                receipts.add(rcptId);
                const erpPoId = index.receiptToErpPo.get(rcptId);
                if (erpPoId) purchaseOrders.add(erpPoId);
            }
            break;
        }
        case "purchaseOrder": {
            purchaseOrders.add(focused.id);
            for (const rcptId of index.erpPoToReceipts.get(focused.id) ?? []) {
                receipts.add(rcptId);
                for (const putId of index.receiptToPutawayTasks.get(rcptId) ?? []) putawayTasks.add(putId);
            }
            break;
        }
        case "allocation": {
            allocations.add(focused.id);
            const poId = index.allocToPo.get(focused.id);
            if (poId) {
                pivotPoIds.add(poId);
                productionOrders.add(poId);
            }
            const soId = index.allocToSo.get(focused.id);
            if (soId) salesOrders.add(soId);
            break;
        }
    }

    // Expand pivot POs to themselves and all linked entities
    for (const poId of pivotPoIds) {
        productionOrders.add(poId);
        const soId = index.poToSo.get(poId);
        if (soId) salesOrders.add(soId);
        for (const opId of index.poToOps.get(poId) ?? []) operations.add(opId);
        for (const dtId of index.poToDowntimes.get(poId) ?? []) downtimeEvents.add(dtId);
        for (const woId of index.poToWorkOrders.get(poId) ?? []) eamWorkOrders.add(woId);
        for (const aId of index.poToAllocations.get(poId) ?? []) allocations.add(aId);
    }

    return {
        salesOrders,
        productionOrders,
        operations,
        downtimeEvents,
        eamWorkOrders,
        pickTasks,
        receipts,
        putawayTasks,
        purchaseOrders,
        allocations,
    };
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
        case "salesOrder":
            return correlated.salesOrders;
        case "productionOrder":
            return correlated.productionOrders;
        case "operation":
            return correlated.operations;
        case "downtime":
            return correlated.downtimeEvents;
        case "workOrder":
            return correlated.eamWorkOrders;
        case "pickTask":
            return correlated.pickTasks;
        case "receipt":
            return correlated.receipts;
        case "putawayTask":
            return correlated.putawayTasks;
        case "purchaseOrder":
            return correlated.purchaseOrders;
        case "allocation":
            return correlated.allocations;
    }
}
