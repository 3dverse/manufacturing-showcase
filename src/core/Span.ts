import { EAM, ERP, MES } from "@/core/APIs";
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
} from "@/core/Scope";
import type { NavGraphNode } from "@/content/type";
import type { WorkOrder } from "_prebuild/api-libs/eam";
import type { DowntimeEvent, OperationDetail, ProductionOrder } from "_prebuild/api-libs/mes";
import type { SalesOrder } from "_prebuild/api-libs/erp";

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
            EAM.getWorkOrders({ siteId, locationId: locId, scheduledFrom: from, scheduledTo: to, pageSize: PAGE_SIZE })
                .then((r) => r.data.data ?? []),
        ),
    );
    for (const wo of woPages.flat()) span.eamWorkOrders.set(wo.id, mapWorkOrder(wo));

    buildSpanIndexes(span);
    return span;
}
