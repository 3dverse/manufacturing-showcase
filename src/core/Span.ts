import { EAM, ERP, MES, WMS, WMSInbound, WMSInventory } from "@/core/APIs";
import {
    emptySpan,
    buildSpanIndexes,
    locationIdsFromNode,
    workCenterIdsFromNode,
    type TimelineSpan,
    type ProductionOrderEntry,
    type OperationEntry,
    type DowntimeEntry,
    type WorkOrderEntry,
    type SalesOrderEntry,
    type PickTaskEntry,
    type ReceiptEntry,
    type PutawayTaskEntry,
    type PurchaseOrderEntry,
    type AllocationEntry,
} from "@/core/Scope";
import { isArea } from "@/core/NavGraph";
import type { NavGraphNode } from "@/content/type";
import type { WorkOrder } from "_prebuild/api-libs/eam";
import type { PurchaseOrder, SalesOrder } from "_prebuild/api-libs/erp";
import type { DowntimeEvent, OperationDetail, ProductionOrder } from "_prebuild/api-libs/mes";
import type { PickTask, Receipt, PutawayTask, StockAllocation } from "_prebuild/api-libs/wms";
import { FULL_TIMELINE } from "@/content/3dverse";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 1000;

// Window: 3 months back, 2 months forward, truncated to the nearest hour so
// the key is stable across renders within the same hour.
const WINDOW_BACK_SECS = 3 * 30 * 86400;
const WINDOW_FWD_SECS = 2 * 30 * 86400;

export function spanWindow(): { from: number; to: number } {
    const refNow = Math.floor(Date.now() / 3_600_000) * 3600;
    return { from: refNow - WINDOW_BACK_SECS, to: refNow + WINDOW_FWD_SECS };
}

// ---------------------------------------------------------------------------
// Simulation filter
// ---------------------------------------------------------------------------

/**
 * When true, the span is filtered to simulate a "present moment" view:
 *  - Sales orders:       only those with orderDate ≤ now
 *  - Production orders:  only those linked to a visible sales order
 *  - Operations:         only those belonging to a visible production order
 *  - Downtime events:    only those that started ≤ now
 *  - WMS receipts / putaway tasks / pick tasks / allocations: only those dated ≤ now
 *    (i.e. records that have already occurred; future records are hidden)
 *
 * Toggle this constant to disable the filter during development.
 */

function applySimulationFilter(span: TimelineSpan): void {
    const now = Math.floor(Date.now() / 1000);

    // Sales orders: only those already placed
    for (const [id, so] of span.salesOrders) {
        if (so.orderDate > now) span.salesOrders.delete(id);
    }

    // Production orders: only those linked to a visible SO
    for (const [id, po] of span.productionOrders) {
        if (po.erpSalesOrderId && !span.salesOrders.has(po.erpSalesOrderId)) span.productionOrders.delete(id);
    }

    // Operations: only those belonging to a visible PO
    for (const [id, op] of span.operations) {
        if (!span.productionOrders.has(op.productionOrderId)) span.operations.delete(id);
    }

    // Downtime: only events that have already started
    for (const [id, dt] of span.downtimeEvents) {
        if (dt.startedAt > now) span.downtimeEvents.delete(id);
    }

    // WMS: hide future records — show only past/current work (date ≤ now or undated)
    for (const [id, r] of span.receipts) {
        if (r.receivedDate > now) span.receipts.delete(id);
    }
    for (const [id, pt] of span.putawayTasks) {
        if (pt.putawayDate !== null && pt.putawayDate > now) span.putawayTasks.delete(id);
    }
    for (const [id, pt] of span.pickTasks) {
        if (pt.pickedDate !== null && pt.pickedDate > now) span.pickTasks.delete(id);
    }
    for (const [id, a] of span.allocations) {
        if (a.allocatedAt > now) span.allocations.delete(id);
    }

    // Purchase orders: only those already placed
    for (const [id, po] of span.purchaseOrders) {
        if (po.orderDate > now) span.purchaseOrders.delete(id);
    }
}

// ---------------------------------------------------------------------------
// Mappers — raw API responses → typed span entries
// ---------------------------------------------------------------------------

function mapPO(po: ProductionOrder): ProductionOrderEntry {
    const t = po.timing ?? {};
    const q = po.quantities;
    return {
        id: po.id,
        orderNumber: po.orderNumber,
        locationId: po.locationId!,
        itemCode: po.itemCode,
        status: po.status,
        timing: {
            scheduledStart: Number(t.scheduledStart ?? 0),
            scheduledEnd: Number(t.scheduledEnd ?? 0),
            actualStart: t.actualStart ? Number(t.actualStart) : undefined,
            actualEnd: t.actualEnd ? Number(t.actualEnd) : undefined,
        },
        quantities: {
            plannedQuantity: q.plannedQuantity,
            uom: q.uom,
        },
        erpSalesOrderId: po.erpSalesOrderId ?? null,
    };
}

function mapOp(op: OperationDetail): OperationEntry {
    return {
        id: op.id,
        productionOrderId: op.productionOrderId,
        workCenterId: op.workCenterId,
        operationCode: op.operationCode,
        operationDescription: op.operationDescription,
        sequence: op.sequence,
        status: op.status,
        scheduledStart: Number(op.scheduledStart ?? 0),
        scheduledEnd: Number(op.scheduledEnd ?? 0),
        actualStart: op.actualStart ? Number(op.actualStart) : undefined,
        actualEnd: op.actualEnd ? Number(op.actualEnd) : undefined,
        progressPercent: op.progressPercent,
        quantities: {
            plannedQuantity: op.quantities.plannedQuantity,
            producedQuantity: op.quantities.producedQuantity,
            goodQuantity: op.quantities.goodQuantity,
            scrapQuantity: op.quantities.scrapQuantity,
            uom: op.quantities.uom,
        },
        plannedRunTimeMinutes: op.plannedRunTimeMinutes,
        actualRunTimeMinutes: op.actualRunTimeMinutes,
    };
}

function mapDowntime(dt: DowntimeEvent): DowntimeEntry {
    return {
        id: dt.id,
        workCenterId: dt.workCenterId,
        startedAt: Number(dt.startedAt),
        endedAt: dt.endedAt ? Number(dt.endedAt) : undefined,
        reasonCode: dt.reasonCode,
        reasonDescription: dt.reasonDescription,
        productionOrderId: dt.productionOrderId,
    };
}

function mapSalesOrder(so: SalesOrder): SalesOrderEntry {
    return {
        id: so.id,
        orderNumber: so.orderNumber,
        customerId: so.customerId,
        status: so.status,
        orderDate: so.orderDate,
        requestedDeliveryDate: so.requestedDeliveryDate ?? 0,
        siteId: so.siteId,
    };
}

function mapWorkOrder(wo: WorkOrder): WorkOrderEntry {
    return {
        id: wo.id,
        workOrderNumber: wo.workOrderNumber,
        workType: wo.workType,
        status: wo.status,
        assetId: wo.assetId,
        locationId: wo.locationId ?? null,
        scheduledStart: Number(wo.scheduledStart ?? 0),
        scheduledEnd: Number(wo.scheduledEnd ?? 0),
        actualStart: wo.actualStart ? Number(wo.actualStart) : undefined,
        actualEnd: wo.actualEnd ? Number(wo.actualEnd) : undefined,
        mesProductionOrderId: wo.mesProductionOrderId ?? null,
    };
}

function mapReceipt(r: Receipt): ReceiptEntry {
    return {
        id: r.id,
        warehouseId: r.warehouseId,
        status: r.status,
        itemId: r.lines[0]?.itemId ?? "",
        quantity: r.lines[0]?.quantity ?? 0,
        receivedDate: r.receivedAt,
        erpPurchaseOrderId: r.erpPurchaseOrderId ?? null,
    };
}

function mapPutawayTask(pt: PutawayTask): PutawayTaskEntry {
    return {
        id: pt.id,
        warehouseId: pt.warehouseId,
        receiptId: pt.receiptId ?? null,
        status: pt.status,
        itemId: pt.itemId,
        quantity: pt.quantity,
        putawayDate: pt.putawayDate ?? null,
        createdAt: pt.createdAt,
        sourceLocationId: pt.sourceLocationId ?? null,
        destinationLocationId: pt.destinationLocationId ?? null,
    };
}

function mapAllocation(a: StockAllocation): AllocationEntry {
    return {
        id: a.id,
        warehouseId: a.warehouseId,
        locationId: a.locationId,
        itemId: a.itemId,
        quantityAllocated: a.quantityAllocated,
        quantityRequired: a.quantityRequired,
        uom: a.uom,
        demandType: a.demandType as "production_order" | "sales_order",
        productionOrderId: a.productionOrderId ?? null,
        erpSalesOrderId: a.erpSalesOrderId ?? null,
        status: a.status as "allocated" | "partial",
        allocatedAt: a.allocatedAt,
        clearedAt: a.clearedAt ?? null,
    };
}

function mapPickTask(pt: PickTask): PickTaskEntry {
    return {
        id: pt.id,
        warehouseId: pt.warehouseId,
        status: pt.status,
        itemId: pt.itemId,
        quantity: pt.quantity,
        uom: pt.uom,
        salesOrderId: pt.salesOrderId ?? null,
        pickedDate: pt.pickedDate ?? null,
        createdAt: pt.createdAt,
        sourceLocationId: pt.sourceLocationId ?? null,
    };
}

function mapPurchaseOrder(po: PurchaseOrder): PurchaseOrderEntry {
    const firstLine = po.lines[0];
    return {
        id: po.id,
        orderNumber: po.orderNumber,
        supplierId: po.supplierId,
        supplierName: po.supplierName,
        itemId: firstLine?.itemId ?? "",
        orderedQuantity: firstLine?.orderedQuantity ?? 0,
        orderDate: po.orderDate,
        expectedDeliveryDate: firstLine?.expectedReceiptDate ?? null,
        receivedAt: po.receivedAt ?? null,
        status: po.status,
    };
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export async function fetchSpan(node: NavGraphNode, siteId: string, from: number, to: number): Promise<TimelineSpan> {
    const span = emptySpan();

    const locationIds = locationIdsFromNode(node);
    const workCenterIds = workCenterIdsFromNode(node);

    // Production orders — one request per location
    const poPages = await Promise.all(
        locationIds.map((locId) =>
            MES.listProductionOrders({
                siteId,
                locationId: locId,
                scheduledFrom: from,
                scheduledTo: to,
                pageSize: PAGE_SIZE,
            }).then((r) => r.data.data),
        ),
    );
    for (const po of poPages.flat()) span.productionOrders.set(po.id, mapPO(po));

    // Operations — one request per work center
    const opPages = await Promise.all(
        workCenterIds.map((wcId) =>
            MES.listOperations({
                siteId,
                workCenterId: wcId,
                scheduledFrom: from,
                scheduledTo: to,
                pageSize: PAGE_SIZE,
            }).then((r) => r.data.data),
        ),
    );
    for (const op of opPages.flat()) span.operations.set(op.id, mapOp(op));

    // Downtime — always fetched for all work centers in scope
    const dtPages = await Promise.all(
        workCenterIds.map((wcId) =>
            MES.listDowntimeEvents({
                siteId,
                workCenterId: wcId,
                startedFrom: from,
                startedTo: to,
                pageSize: PAGE_SIZE,
            }).then((r) => r.data.data),
        ),
    );
    for (const dt of dtPages.flat()) span.downtimeEvents.set(dt.id, mapDowntime(dt));

    // Sales orders — site-wide, no time filter
    const soResp = await ERP.getSalesOrders({ siteId, pageSize: PAGE_SIZE });
    for (const so of soResp.data.data) span.salesOrders.set(so.id, mapSalesOrder(so));

    // EAM work orders — one request per location, indexed by location and asset
    const woPages = await Promise.all(
        locationIds.map((locId) =>
            EAM.getWorkOrders({
                siteId,
                locationId: locId,
                scheduledFrom: from,
                scheduledTo: to,
                pageSize: PAGE_SIZE,
            }).then((r) => r.data.data ?? []),
        ),
    );
    for (const wo of woPages.flat()) span.eamWorkOrders.set(wo.id, mapWorkOrder(wo));

    // Pick tasks + FG allocations — only fetched when navigating to a Delivery area node
    if (isArea(node) && node.name.toLowerCase() === "delivery") {
        const [ptResp, allocResp] = await Promise.all([
            WMS.getPickTasks({ siteId, fromDate: from, toDate: to }),
            WMSInventory.getAllocations({ siteId, warehouseId: node.hash }),
        ]);
        for (const pt of ptResp.data.data) span.pickTasks.set(pt.id, mapPickTask(pt));
        for (const a of allocResp.data.data) span.allocations.set(a.id, mapAllocation(a));
    }

    // Receipts + putaway tasks + purchase orders — only fetched when navigating to a Reception area node
    if (isArea(node) && node.name.toLowerCase() === "reception") {
        const [rcptResp, putResp, poResp] = await Promise.all([
            WMSInbound.getReceipts({ siteId, fromDate: from, toDate: to }),
            WMSInbound.getPutawayTasks({ siteId, fromDate: from, toDate: to }),
            ERP.getPurchaseOrders({ siteId, orderDateFrom: from, orderDateTo: to, pageSize: PAGE_SIZE }),
        ]);
        for (const r of rcptResp.data.data) span.receipts.set(r.id, mapReceipt(r));
        for (const pt of putResp.data.data) span.putawayTasks.set(pt.id, mapPutawayTask(pt));
        for (const po of poResp.data.data) span.purchaseOrders.set(po.id, mapPurchaseOrder(po));
    }

    // Storage area: putaway tasks (inbound) + stock allocations (RM + FG pre-QC)
    if (isArea(node) && node.name.toLowerCase() === "storage") {
        const [putResp, allocResp] = await Promise.all([
            WMSInbound.getPutawayTasks({ siteId, fromDate: from, toDate: to }),
            WMSInventory.getAllocations({ siteId, warehouseId: node.hash }),
        ]);
        for (const put of putResp.data.data) span.putawayTasks.set(put.id, mapPutawayTask(put));
        for (const a of allocResp.data.data) span.allocations.set(a.id, mapAllocation(a));
    }

    if (!FULL_TIMELINE) applySimulationFilter(span);
    buildSpanIndexes(span);
    return span;
}
