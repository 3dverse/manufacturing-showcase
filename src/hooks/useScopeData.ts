import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

//------------------------------------------------------------------------------
import { EAM, MES } from "@/core/APIs";
import {
    emptyCache,
    buildCacheIndexes,
    scopeFromNode,
    scopeKey,
    locationIdsFromNode,
    workCenterIdsFromNode,
    type ScopedTimelineState,
    type TimelineCache,
    type ProductionOrderEntry,
    type OperationEntry,
    type DowntimeEntry,
    type WorkOrderEntry,
} from "@/core/ScopedState";
import { isCell, isFactory, isLine, isMachine } from "@/core/NavGraph";
import type { NavGraphNode } from "@/content/type";
import { useFactoryStore } from "@/store/useFactoryStore";
import type { WorkOrder } from "_prebuild/api-libs/eam";
import type { DowntimeEvent, OperationDetail, ProductionOrder } from "_prebuild/api-libs/mes";

//------------------------------------------------------------------------------
const PAGE_SIZE = 1000;

// Window: 3 months back, 2 months forward from system clock
const WINDOW_BACK_SECS = 3 * 30 * 86400;
const WINDOW_FWD_SECS = 2 * 30 * 86400;

//------------------------------------------------------------------------------
// Mappers — convert raw API responses to typed cache entries
//------------------------------------------------------------------------------

function mapPO(po: ProductionOrder): ProductionOrderEntry {
    const t = po.timing ?? {};
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
        erpSalesOrderId: po.erpSalesOrderId ?? null,
    };
}

function mapOp(op: OperationDetail): OperationEntry {
    return {
        id: op.id,
        productionOrderId: op.productionOrderId,
        workCenterId: op.workCenterId,
        operationCode: op.operationCode,
        sequence: op.sequence,
        status: op.status,
        scheduledStart: Number(op.scheduledStart ?? 0),
        scheduledEnd: Number(op.scheduledEnd ?? 0),
        actualStart: op.actualStart ? Number(op.actualStart) : undefined,
        actualEnd: op.actualEnd ? Number(op.actualEnd) : undefined,
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

function mapWorkOrder(wo: WorkOrder): WorkOrderEntry {
    return {
        id: wo.id,
        workOrderNumber: wo.workOrderNumber,
        workType: wo.workType,
        status: wo.status,
        assetId: wo.assetId,
        scheduledStart: Number(wo.scheduledStart ?? 0),
        scheduledEnd: Number(wo.scheduledEnd ?? 0),
        actualStart: wo.actualStart ? Number(wo.actualStart) : undefined,
        actualEnd: wo.actualEnd ? Number(wo.actualEnd) : undefined,
        mesProductionOrderId: wo.mesProductionOrderId ?? null,
    };
}

//------------------------------------------------------------------------------
// Fetch — builds and returns a populated cache for the given node scope
//------------------------------------------------------------------------------

async function fetchForNode(node: NavGraphNode, siteId: string, from: number, to: number): Promise<TimelineCache> {
    const cache = emptyCache();

    if (isFactory(node)) {
        // TODO: fetch sales orders once ERP API client is added to APIs.ts
        return cache;
    }

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
    for (const po of poPages.flat()) cache.productionOrders.set(po.id, mapPO(po));

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
    for (const op of opPages.flat()) cache.operations.set(op.id, mapOp(op));

    // Downtime — line, cell, and machine levels
    if (isLine(node) || isCell(node) || isMachine(node)) {
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
        for (const dt of dtPages.flat()) cache.downtimeEvents.set(dt.id, mapDowntime(dt));
    }

    // EAM work orders — machine level only, keyed by assetId
    if (isMachine(node)) {
        const woResp = await EAM.getWorkOrders({ assetId: node.hash, pageSize: PAGE_SIZE });
        cache.eamWorkOrdersByAsset.set(node.hash, (woResp.data.data ?? []).map(mapWorkOrder));
    }

    buildCacheIndexes(cache);
    return cache;
}

//------------------------------------------------------------------------------
// Hook
//------------------------------------------------------------------------------

export function useScopeData(node: NavGraphNode | null): {
    state: ScopedTimelineState | null;
    isLoading: boolean;
} {
    const siteId = useFactoryStore((state) => state.currentFactory?.scene_id ?? "");

    const workCenterIds = useMemo(() => (node ? workCenterIdsFromNode(node) : []), [node]);
    const key = useMemo(() => scopeKey(workCenterIds), [workCenterIds]);

    // Truncate to the nearest hour so the query key is stable across renders.
    // The window is 5 months wide so hour-level precision is more than enough.
    const refNow = Math.floor(Date.now() / 3_600_000) * 3600;
    const from = refNow - WINDOW_BACK_SECS;
    const to = refNow + WINDOW_FWD_SECS;

    const { data: cache, isLoading } = useQuery({
        queryKey: ["timelineState", siteId, key, from, to],
        queryFn: () => fetchForNode(node!, siteId, from, to),
        enabled: node !== null && siteId !== "",
        staleTime: Infinity,
    });

    const state = useMemo(() => (node && cache ? scopeFromNode(node, cache) : null), [node, cache]);

    return { state, isLoading };
}
