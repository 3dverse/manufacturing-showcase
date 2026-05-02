import { useState, useEffect } from "react";

import { MES, ERP, EAM } from "@/core/APIs";
import { orderStatus } from "@/content/orders";
import { useTimelineStore } from "@/store/useTimelineStore";
import { projectSnapshot } from "@/core/Projection";
import type { ProjectedStatus, ProjectedWorkOrder } from "@/core/Projection";
import type { ProductionOrderEntry, DowntimeEntry, WorkOrderEntry, AsOfSnapshot } from "@/core/Scope";

import type { Order } from "@/content/type";
import type { ProductionOrder, DowntimeEvent } from "_prebuild/api-libs/mes";
import type { SalesOrder } from "_prebuild/api-libs/erp";
import type { WorkOrder } from "_prebuild/api-libs/eam";

//------------------------------------------------------------------------------
export type HomeDowntimeEvent = {
    id: string;
    type: "stop" | "maintenance";
    label: string;
    details: string;
    startMs: number;
    endMs: number;
};

//------------------------------------------------------------------------------
function statusToOrderStatus(status: ProjectedStatus, apiStatus: string) {
    if (apiStatus === "cancelled") return orderStatus.cancelled;
    switch (status) {
        case "completed":
            return orderStatus.completed;
        case "in_progress":
            return orderStatus.inProgress;
        case "planned":
            return orderStatus.planned;
    }
}

//------------------------------------------------------------------------------
function toPoEntry(po: ProductionOrder): ProductionOrderEntry {
    const t = po.timing ?? {};
    return {
        id: po.id,
        orderNumber: po.orderNumber,
        locationId: po.locationId ?? "",
        itemCode: po.itemCode,
        status: po.status,
        timing: {
            scheduledStart: Number(t.scheduledStart ?? 0),
            scheduledEnd: Number(t.scheduledEnd ?? 0),
            actualStart: t.actualStart ? Number(t.actualStart) : undefined,
            actualEnd: t.actualEnd ? Number(t.actualEnd) : undefined,
        },
        quantities: { plannedQuantity: po.quantities.plannedQuantity, uom: po.quantities.uom },
        erpSalesOrderId: po.erpSalesOrderId ?? null,
    };
}

//------------------------------------------------------------------------------
function toDtEntry(dt: DowntimeEvent): DowntimeEntry {
    return {
        id: dt.id,
        workCenterId: dt.workCenterId,
        startedAt: Number(dt.startedAt),
        endedAt: dt.endedAt ? Number(dt.endedAt) : undefined,
        reasonCode: dt.reasonCode,
        reasonDescription: dt.reasonDescription,
    };
}

//------------------------------------------------------------------------------
function toWoEntry(wo: WorkOrder): WorkOrderEntry {
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
    };
}

//------------------------------------------------------------------------------
export function useHomePageData(siteId: string): {
    orders: Order[];
    downtimeEvents: HomeDowntimeEvent[];
    eamWorkOrders: ProjectedWorkOrder[];
    isLoading: boolean;
    refTs: number;
} {
    const asOf = useTimelineStore((s) => s.asOf);
    const present = useTimelineStore((s) => s.present);

    const [orders, setOrders] = useState<Order[]>([]);
    const [downtimeEvents, setDowntimeEvents] = useState<HomeDowntimeEvent[]>([]);
    const [eamWorkOrders, setEamWorkOrders] = useState<ProjectedWorkOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Use asOf when set (scenario scrub), otherwise dataset present
    const refTs = asOf ?? present;

    useEffect(() => {
        if (!siteId) return;

        setIsLoading(true);
        // Fetch window: 7 days back (+ 2-day buffer for long orders), 3 days forward
        const from = refTs - 9 * 86400;
        const to = refTs + 3 * 86400;

        Promise.all([
            MES.listProductionOrders({ siteId, scheduledFrom: from, scheduledTo: to, pageSize: 500 }),
            ERP.getSalesOrders({ siteId, pageSize: 500 }),
            MES.listDowntimeEvents({ siteId, startedFrom: from, startedTo: to, pageSize: 500 }),
            EAM.getWorkOrders({ siteId, scheduledFrom: from, scheduledTo: to, pageSize: 500 }),
        ])
            .then(([poResp, soResp, dtResp, woResp]) => {
                const soMap = new Map<string, SalesOrder>(soResp.data.data.map((so) => [so.id, so]));

                const poEntries = poResp.data.data.map(toPoEntry);
                const dtEntries = dtResp.data.data.map(toDtEntry);
                const woEntries = (woResp.data.data ?? []).map(toWoEntry);

                // Project all entries to refTs
                const snapshot: AsOfSnapshot = {
                    level: "factory",
                    salesOrders: [],
                    productionOrders: poEntries,
                    operations: [],
                    downtimeEvents: dtEntries,
                    eamWorkOrders: woEntries,
                    pickTasks: [],
                    receipts: [],
                    putawayTasks: [],
                    purchaseOrders: [],
                    allocations: [],
                };
                const projected = projectSnapshot(snapshot, refTs);

                setOrders(
                    projected.productionOrders.map((po) => {
                        const so = po.erpSalesOrderId ? soMap.get(po.erpSalesOrderId) : undefined;
                        return {
                            ref: po.orderNumber,
                            client: (so?.customerName?.trim() || so?.customerId) ?? po.itemCode,
                            status: statusToOrderStatus(po.status, po.status),
                            startDate: new Date((po.timing.actualStart ?? po.timing.scheduledStart) * 1000),
                            endDate: new Date((po.timing.actualEnd ?? po.timing.scheduledEnd) * 1000),
                            unitsPlanned: po.quantities.plannedQuantity,
                            unitsCompleted: po.quantities.producedQuantity,
                        };
                    }),
                );

                setDowntimeEvents(
                    projected.downtimeEvents.map((dt) => ({
                        id: dt.id,
                        type: "stop" as const,
                        label: dt.workCenterId,
                        details: dt.reasonDescription ?? dt.reasonCode,
                        startMs: dt.startedAt * 1000,
                        endMs: (dt.projected.isOngoing ? refTs : dt.endedAt!) * 1000,
                    })),
                );

                setEamWorkOrders(projected.eamWorkOrders);
            })
            .catch(() => {})
            .finally(() => setIsLoading(false));
    }, [siteId, refTs]);

    return { orders, downtimeEvents, eamWorkOrders, isLoading, refTs };
}
