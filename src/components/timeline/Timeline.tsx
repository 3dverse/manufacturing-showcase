import {
    useContext,
    useEffect,
    useMemo,
    useRef,
    useCallback,
    useState,
    type MouseEvent as ReactMouseEvent,
    type TouchEvent as ReactTouchEvent,
} from "react";
import { createPortal } from "react-dom";

//------------------------------------------------------------------------------

//------------------------------------------------------------------------------
import { useScope } from "@/hooks/useScope";
import { useSpanSnapshot } from "@/hooks/useSpanSnapshot";
import { useProjection } from "@/hooks/useProjection";
import { useCorrelation } from "@/hooks/useCorrelation";
import { SelectionContext } from "@/contexts/SelectionContext";
import { useTimelineStore } from "@/store/useTimelineStore";
import { useFocusStore } from "@/store/useFocusStore";
import { ScenarioContext } from "@/contexts/ScenariosContext";

//------------------------------------------------------------------------------
import { Router } from "@/core/Router";
import { isArea } from "@/core/SceneGraph";
import {
    highlightStateForBar,
    entityTypeFromId,
    buildCorrelatedSnapshot,
    EMPTY_CORRELATED_SET,
} from "@/core/Correlation";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";
import { fromPct, toPct } from "./timeUtils";
import { fmtDuration, fmtTs } from "@/utils/helpers-time";
import { buildClosedIntervals } from "@/core/Calendar";

//------------------------------------------------------------------------------
import { FooterTabs } from "./FooterTabs";
import { Band } from "./Band";
import { Bar } from "./Bar";

//------------------------------------------------------------------------------
import { PERFORMANCE_MODE, FULL_TIMELINE } from "@/content/3dverse";
import { ENTITY_COLORS } from "@/content/entityColors";

//------------------------------------------------------------------------------
import type { EntityType } from "@/core/Correlation";
import type {
    TimelineLevel,
    AsOfSnapshot,
    SalesOrderEntry,
    ProductionOrderEntry,
    OperationEntry,
    ReceiptEntry,
    AllocationEntry,
    PickTaskEntry,
    PutawayTaskEntry,
    PurchaseOrderEntry,
    DowntimeEntry,
    WorkOrderEntry,
} from "@/core/Scope";

//------------------------------------------------------------------------------
// Zoom levels
//------------------------------------------------------------------------------
import {
    AXIS_H,
    PLAYBACK_SPEEDS,
    ROW_GAP,
    ROW_H,
    ROW_H_LINE,
    ZOOMS,
    type BarItem,
    type BarStyle,
    type PlaybackSpeed,
    type StackingStyle,
} from "./constants";
import { FactoryContext } from "@/contexts/FactoryContext";
import type { CellNode, SceneGraphNode } from "@/content/type";
import { NodeTypes } from "@/content/enums";

type AreaType = "production" | "delivery" | "reception" | "storage" | "quality" | "other";

type Tick = { ts: number; label: string; major: boolean };

function buildTicks(winStart: number, winEnd: number, totalDays: number): Tick[] {
    const ticks: Tick[] = [];

    if (totalDays <= 14) {
        const cur = new Date(winStart * 1000);
        cur.setHours(0, 0, 0, 0);
        cur.setDate(cur.getDate() + 1);
        while (cur.getTime() / 1000 <= winEnd) {
            ticks.push({
                ts: cur.getTime() / 1000,
                label: cur.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
                major: cur.getDay() === 1 || totalDays <= 7,
            });
            cur.setDate(cur.getDate() + 1);
        }
    } else if (totalDays <= 60) {
        const cur = new Date(winStart * 1000);
        const dow = cur.getDay();
        cur.setDate(cur.getDate() + ((8 - dow) % 7 || 7));
        cur.setHours(0, 0, 0, 0);
        while (cur.getTime() / 1000 <= winEnd) {
            ticks.push({
                ts: cur.getTime() / 1000,
                label: cur.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
                major: cur.getDate() <= 7,
            });
            cur.setDate(cur.getDate() + 7);
        }
    } else {
        const cur = new Date(winStart * 1000);
        cur.setDate(1);
        cur.setHours(0, 0, 0, 0);
        cur.setMonth(cur.getMonth() + 1);
        while (cur.getTime() / 1000 <= winEnd) {
            ticks.push({
                ts: cur.getTime() / 1000,
                label: cur.toLocaleDateString(undefined, {
                    month: "short",
                    ...(totalDays > 120 ? { year: "2-digit" } : {}),
                }),
                major: true,
            });
            cur.setMonth(cur.getMonth() + 1);
        }
    }

    return ticks;
}

//------------------------------------------------------------------------------
// Bar types
//------------------------------------------------------------------------------
type Story = {
    id: string;
    title: string;
    label: string;
    lanes: BarItem[][];
    barStyle: BarStyle;
    stackingStyle: StackingStyle;
};

//------------------------------------------------------------------------------
// Lane assignment
//------------------------------------------------------------------------------
function assignSwimlanes(bars: BarItem[]): BarItem[][] {
    const sorted = [...bars].sort((a, b) => a.start - b.start);
    const lanes: BarItem[][] = [];
    const tails: number[] = [];

    for (const bar of sorted) {
        let placed = false;
        for (let i = 0; i < lanes.length; i++) {
            if (tails[i] <= bar.start) {
                lanes[i].push(bar);
                tails[i] = bar.end;
                placed = true;
                break;
            }
        }
        if (!placed) {
            lanes.push([bar]);
            tails.push(bar.end);
        }
    }

    return lanes.length ? lanes : [[]];
}

function buildLanes(bars: BarItem[], stacking: StackingStyle): BarItem[][] {
    if (stacking === "overlap") return bars.length ? [bars] : [[]];
    return assignSwimlanes(bars);
}

//------------------------------------------------------------------------------
// Story builders — receive projected entries, read fields directly
//------------------------------------------------------------------------------

function buildSalesOrdersStory(orders: SalesOrderEntry[]): Story {
    const bars: BarItem[] = orders.map((so) => ({
        id: so.id,
        entityType: "salesOrder" as EntityType,
        targetNodeHash: so.siteId,
        start: so.orderDate,
        end: so.requestedDeliveryDate,
        colors: ENTITY_COLORS.salesOrder,
    }));
    return {
        id: "sales",
        title: "Sales Orders",
        label: "SO",
        lanes: buildLanes(bars, "swimlane"),
        barStyle: "line",
        stackingStyle: "swimlane",
    };
}

function clientLabelForProductionOrder(po: ProductionOrderEntry, soById: Map<string, SalesOrderEntry>): string {
    if (!po.erpSalesOrderId) return "Unlinked orders";
    const so = soById.get(po.erpSalesOrderId);
    if (!so) return "Unknown client";
    const name = so.customerName?.trim();
    if (name) return name;
    return so.customerId || "Unknown client";
}

function buildProductionOrdersStories(
    productionOrders: ProductionOrderEntry[],
    salesOrders: SalesOrderEntry[],
): Story[] {
    if (productionOrders.length === 0) return [];
    const soById = new Map(salesOrders.map((s) => [s.id, s]));

    const groups = new Map<string, ProductionOrderEntry[]>();
    for (const po of productionOrders) {
        const key = clientLabelForProductionOrder(po, soById);
        const g = groups.get(key) ?? [];
        g.push(po);
        groups.set(key, g);
    }

    const rank = (k: string) => (k === "Unknown client" || k === "Unlinked orders" ? 1 : 0);
    const sortedKeys = [...groups.keys()].sort((a, b) => {
        const d = rank(a) - rank(b);
        if (d !== 0) return d;
        return a.localeCompare(b);
    });

    return sortedKeys.map((label, index) => {
        const slug =
            label
                .replace(/[^a-zA-Z0-9]+/g, "-")
                .replace(/^-|-$/g, "")
                .slice(0, 48) || "client";
        const bars: BarItem[] = (groups.get(label) ?? []).map((po) => ({
            id: po.id,
            entityType: "productionOrder" as EntityType,
            targetNodeHash: po.locationId || undefined,
            start: po.timing.actualStart ?? po.timing.scheduledStart,
            end: po.timing.actualEnd ?? po.timing.scheduledEnd,
            colors: ENTITY_COLORS.productionOrder,
            inlineLabel: po.orderNumber,
        }));
        return {
            id: `production-${index}-${slug}`,
            title: label,
            label,
            lanes: buildLanes(bars, "swimlane"),
            barStyle: "bar" as const,
            stackingStyle: "swimlane" as const,
        };
    });
}

function buildOperationsStory(ops: OperationEntry[]): Story {
    const bars: BarItem[] = ops.map((op) => ({
        id: op.id,
        entityType: "operation" as EntityType,
        targetNodeHash: op.workCenterId || undefined,
        start: op.actualStart ?? op.scheduledStart,
        end: op.actualEnd ?? op.scheduledEnd,
        colors: ENTITY_COLORS.operation,
    }));
    return {
        id: "operations",
        title: "Operations",
        label: "OP",
        lanes: buildLanes(bars, "swimlane"),
        barStyle: "bar",
        stackingStyle: "swimlane",
    };
}

function buildReceiptsStory(receipts: ReceiptEntry[], putaways: PutawayTaskEntry[], cutOff: number): Story {
    const putawayByReceipt = new Map<string, number>();
    for (const pt of putaways) {
        if (!pt.receiptId) continue;
        const existing = putawayByReceipt.get(pt.receiptId);
        const end = pt.putawayDate ?? cutOff;
        if (existing === undefined || end > existing) putawayByReceipt.set(pt.receiptId, end);
    }

    const bars: BarItem[] = receipts.map((r) => ({
        id: r.id,
        entityType: "receipt" as EntityType,
        targetNodeHash: r.warehouseId || undefined,
        start: r.receivedDate,
        end: putawayByReceipt.get(r.id) ?? cutOff,
        colors: ENTITY_COLORS.receipt,
    }));
    return {
        id: "receipts",
        label: "RCP",
        title: "Receipts",
        lanes: buildLanes(bars, "swimlane"),
        barStyle: "bar",
        stackingStyle: "swimlane",
    };
}

function buildAllocationsStory(
    allocs: AllocationEntry[],
    demandType: "production_order" | "sales_order",
    cutOff: number,
): Story {
    const filtered = allocs.filter((a) => a.demandType === demandType);
    const isRM = demandType === "production_order";
    const bars: BarItem[] = filtered.map((a) => ({
        id: a.id,
        entityType: "allocation" as EntityType,
        targetNodeHash: a.locationId || undefined,
        start: a.allocatedAt,
        end: a.clearedAt ?? cutOff,
        colors: ENTITY_COLORS.allocation,
        isPartial: a.status === "partial",
    }));
    return {
        id: isRM ? "alloc-rm" : "alloc-fg",
        title: isRM ? "Raw Material Allocations" : "Final Good Allocations",
        label: isRM ? "RM alloc" : "FG alloc",
        lanes: buildLanes(bars, "swimlane"),
        barStyle: "line",
        stackingStyle: "swimlane",
    };
}

function buildPickTasksStory(tasks: PickTaskEntry[], cutOff: number): Story {
    const bars: BarItem[] = tasks.map((t) => ({
        id: t.id,
        entityType: "pickTask" as EntityType,
        targetNodeHash: t.sourceLocationId || undefined,
        start: t.startedAt ?? t.createdAt,
        end: t.pickedDate ?? cutOff,
        colors: ENTITY_COLORS.pickTask,
    }));
    return {
        id: "pick-tasks",
        label: "Pickup",
        title: "Pickup tasks",
        lanes: buildLanes(bars, "swimlane"),
        barStyle: "bar",
        stackingStyle: "swimlane",
    };
}

function buildPutawayTasksStory(tasks: PutawayTaskEntry[], cutOff: number): Story {
    const bars: BarItem[] = tasks.map((t) => ({
        id: t.id,
        entityType: "putawayTask" as EntityType,
        targetNodeHash: t.sourceLocationId || undefined,
        start: t.startedAt ?? t.createdAt,
        end: t.putawayDate ?? cutOff,
        colors: ENTITY_COLORS.putawayTask,
    }));
    return {
        id: "putaway-tasks",
        label: "Putaway",
        title: "Putaway Tasks",
        lanes: buildLanes(bars, "swimlane"),
        barStyle: "bar",
        stackingStyle: "swimlane",
    };
}

function buildPurchaseOrdersStory(pos: PurchaseOrderEntry[], cutOff: number): Story {
    const bars: BarItem[] = pos.map((po) => {
        const end = po.receivedAt ?? po.expectedDeliveryDate ?? cutOff;
        return {
            id: po.id,
            entityType: "purchaseOrder" as EntityType,
            start: po.orderDate,
            end: end > po.orderDate ? end : po.orderDate + 3600,
            colors: ENTITY_COLORS.purchaseOrder,
        };
    });
    return {
        id: "purchase-orders",
        label: "PO",
        title: "Purchase orders",
        lanes: buildLanes(bars, "swimlane"),
        barStyle: "line",
        stackingStyle: "swimlane",
    };
}

function buildDowntimesStory(downtimes: DowntimeEntry[], nodeList: SceneGraphNode[]): BarItem[] {
    return downtimes.map((dt) => {
        const cellnode = nodeList.find((n) => n.hash === dt.workCenterId);
        const machineNode = cellnode?.type === NodeTypes.cell ? (cellnode as CellNode).machines[0] : cellnode;
        return {
            id: dt.id,
            entityType: "downtime" as EntityType,
            targetNodeHash: machineNode?.hash || cellnode?.hash,
            start: dt.startedAt,
            end: dt.endedAt!,
            colors: ENTITY_COLORS.downtime,
        };
    });
}

function buildWorkOrdersStory(workOrders: WorkOrderEntry[]): BarItem[] {
    return workOrders.map((wo) => ({
        id: wo.id,
        entityType: "workOrder" as EntityType,
        targetNodeHash: wo.assetId || undefined,
        start: wo.actualStart ?? wo.scheduledStart,
        end: wo.actualEnd ?? wo.scheduledEnd,
        colors: ENTITY_COLORS.workOrder,
    }));
}

//------------------------------------------------------------------------------
// Story selection
//------------------------------------------------------------------------------

function buildStories(
    level: TimelineLevel,
    scope: AsOfSnapshot | null,
    origin: number,
    areatype?: AreaType,
    nodeHash?: string,
): Story[] {
    const so = scope?.salesOrders ?? [];
    const po = scope?.productionOrders ?? [];
    const ops = scope?.operations ?? [];

    const rcp = scope?.receipts ?? [];
    const alloc = scope?.allocations ?? [];
    const picks = (scope?.pickTasks ?? []).filter((t) => {
        if (!nodeHash) return true;
        if (areatype === "storage") return t.warehouseId === nodeHash;
        if (areatype === "delivery") return t.warehouseId === nodeHash;
        return true;
    });
    const putaways = (scope?.putawayTasks ?? []).filter((t) => {
        if (!nodeHash) return true;
        if (areatype === "storage") return t.warehouseId === nodeHash;
        if (areatype === "reception") return t.sourceLocationId?.startsWith(nodeHash) ?? false;
        return true;
    });
    const purchaseOrders = scope?.purchaseOrders ?? [];

    switch (level) {
        case "area":
            switch (areatype) {
                case "production":
                    return buildProductionOrdersStories(po, so);
                case "delivery":
                    return [
                        buildSalesOrdersStory(so),
                        buildAllocationsStory(alloc, "sales_order", origin),
                        ...(FULL_TIMELINE ? [buildPickTasksStory(picks, origin)] : []),
                    ];
                case "reception":
                    return [
                        buildPurchaseOrdersStory(purchaseOrders, origin),
                        buildReceiptsStory(rcp, putaways, origin),
                        ...(FULL_TIMELINE ? [buildPutawayTasksStory(putaways, origin)] : []),
                    ];
                case "storage":
                    return [buildSalesOrdersStory(so), buildAllocationsStory(alloc, "production_order", origin)];
                case "quality":
                    return [
                        buildSalesOrdersStory(so),
                        ...(FULL_TIMELINE ? [buildPutawayTasksStory(putaways, origin)] : []),
                    ];
                default:
                    return [buildSalesOrdersStory(so)];
            }
        case "line":
            return [...buildProductionOrdersStories(po, so), ...(FULL_TIMELINE ? [buildOperationsStory(ops)] : [])];
        case "cell":
        case "machine":
            return [...buildProductionOrdersStories(po, so), ...(FULL_TIMELINE ? [buildOperationsStory(ops)] : [])];
        case "factory":
        default:
            return [buildSalesOrdersStory(so), ...buildProductionOrdersStories(po, so)];
    }
}

//------------------------------------------------------------------------------
// Tooltip content — projects only the single hovered entity
//------------------------------------------------------------------------------
function TimelineTooltip({ entityType, id }: { entityType: EntityType; id: string }) {
    const snapshot = useSpanSnapshot();
    const focused = useMemo(() => ({ type: entityType, id }), [entityType, id]);
    const entitySnapshot = useMemo(
        () => (snapshot ? buildCorrelatedSnapshot(snapshot, focused, EMPTY_CORRELATED_SET) : null),
        [snapshot, focused],
    );
    const projection = useProjection(entitySnapshot);
    if (!projection) return <p className="animate-pulse text-slate-400">Loading…</p>;

    switch (entityType) {
        case "salesOrder": {
            const so = projection.salesOrders.find((s) => s.id === id);
            if (!so) return null;
            return (
                <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Sales Order</p>
                    <div className="font-semibold text-white">{so.orderNumber}</div>
                    <div>
                        <span className="text-slate-500">Status </span>
                        <span className="capitalize">{so.status.replace("_", " ")}</span>
                        {so.projected.isOverdue && <span className="ml-1.5 text-negative-400">overdue</span>}
                    </div>
                    <div>
                        <span className="text-slate-500">Order date </span>
                        {fmtTs(so.orderDate)}
                    </div>
                    <div>
                        <span className="text-slate-500">Delivery </span>
                        {fmtTs(so.requestedDeliveryDate)}
                    </div>
                </div>
            );
        }
        case "productionOrder": {
            const po = projection.productionOrders.find((p) => p.id === id);
            if (!po) return null;
            const slip =
                po.timing.actualEnd && po.timing.actualEnd > po.timing.scheduledEnd
                    ? po.timing.actualEnd - po.timing.scheduledEnd
                    : 0;
            return (
                <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Manufacturing Order</p>
                    <div className="font-semibold text-white">{po.orderNumber}</div>
                    <div className="text-slate-400 text-[11px]">{po.itemCode}</div>
                    <div>
                        <span className="text-slate-500">Status </span>
                        <span className="capitalize">{po.status.replace("_", " ")}</span>
                    </div>
                    <div>
                        <span className="text-slate-500">Planned </span>
                        {fmtTs(po.timing.scheduledStart)} → {fmtTs(po.timing.scheduledEnd)}
                    </div>
                    {po.timing.actualStart && (
                        <div>
                            <span className="text-slate-500">Actual </span>
                            {fmtTs(po.timing.actualStart)}
                            {po.timing.actualEnd ? ` → ${fmtTs(po.timing.actualEnd)}` : " (ongoing)"}
                        </div>
                    )}
                    <div>
                        <span className="text-slate-500">Qty </span>
                        {po.quantities.producedQuantity} / {po.quantities.plannedQuantity} {po.quantities.uom}
                        {po.status === "in_progress" && (
                            <span className="ml-1 text-slate-400">
                                ({Math.round(po.projected.estimatedProgress * 100)}%)
                            </span>
                        )}
                    </div>
                    {slip > 0 && <div className="text-amber-400">Slip +{fmtDuration(slip)}</div>}
                </div>
            );
        }
        case "operation": {
            const op = projection.operations.find((o) => o.id === id);
            if (!op) return null;
            const slip = op.actualEnd && op.actualEnd > op.scheduledEnd ? op.actualEnd - op.scheduledEnd : 0;
            return (
                <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Operation</p>
                    <div className="font-semibold text-white">{op.operationCode}</div>
                    <div>
                        <span className="text-slate-500">Status </span>
                        <span className="capitalize">{op.status.replace("_", " ")}</span>
                    </div>
                    <div>
                        <span className="text-slate-500">Planned </span>
                        {fmtTs(op.scheduledStart)} → {fmtTs(op.scheduledEnd)}
                    </div>
                    {op.actualStart && (
                        <div>
                            <span className="text-slate-500">Actual </span>
                            {fmtTs(op.actualStart)}
                            {op.actualEnd ? ` → ${fmtTs(op.actualEnd)}` : " (ongoing)"}
                        </div>
                    )}
                    {op.status === "in_progress" && (
                        <div>
                            <span className="text-slate-500">Progress </span>
                            {Math.round(op.projected.estimatedProgress * 100)}%
                        </div>
                    )}
                    {slip > 0 && <div className="text-amber-400">Slip +{fmtDuration(slip)}</div>}
                </div>
            );
        }
        case "downtime": {
            const dt = projection.downtimeEvents.find((d) => d.id === id);
            if (!dt) return null;
            return (
                <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Downtime Event</p>
                    <div className="font-semibold text-warning-400">
                        {dt.reasonCode}
                        {dt.projected.isOngoing && (
                            <span className="ml-1.5 text-[10px] text-warning-400/80">ongoing</span>
                        )}
                    </div>
                    {dt.reasonDescription && <div className="text-slate-400 text-[11px]">{dt.reasonDescription}</div>}
                    <div>
                        <span className="text-slate-500">Start </span>
                        {fmtTs(dt.startedAt)}
                    </div>
                    <div>
                        <span className="text-slate-500">Duration </span>
                        {fmtDuration(dt.projected.durationAtAsOf)}
                    </div>
                </div>
            );
        }
        case "workOrder": {
            const wo = projection.eamWorkOrders.find((w) => w.id === id);
            if (!wo) return null;
            return (
                <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Work Order</p>
                    <div className="font-semibold text-white">{wo.workOrderNumber}</div>
                    <div>
                        <span className="text-slate-500">Type </span>
                        <span className="capitalize">{wo.workType.replace(/_/g, " ")}</span>
                    </div>
                    <div>
                        <span className="text-slate-500">Status </span>
                        <span className="capitalize">{wo.status.replace("_", " ")}</span>
                        {wo.projected.isOverdue && <span className="ml-1.5 text-red-400">overdue</span>}
                    </div>
                    <div>
                        <span className="text-slate-500">Planned </span>
                        {fmtTs(wo.scheduledStart)} → {fmtTs(wo.scheduledEnd)}
                    </div>
                    {wo.actualStart && (
                        <div>
                            <span className="text-slate-500">Actual </span>
                            {fmtTs(wo.actualStart)}
                            {wo.actualEnd ? ` → ${fmtTs(wo.actualEnd)}` : " (ongoing)"}
                        </div>
                    )}
                </div>
            );
        }
        case "receipt": {
            const r = projection.receipts.find((r) => r.id === id);
            if (!r) return null;
            return (
                <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Receipt</p>
                    <div className="font-semibold text-white">{r.id}</div>
                    <div className="text-slate-400 text-[11px]">{r.itemId}</div>
                    <div>
                        <span className="text-slate-500">Status </span>
                        <span className="capitalize">{r.status.replace("_", " ")}</span>
                    </div>
                    <div>
                        <span className="text-slate-500">Qty </span>
                        {r.quantity}
                    </div>
                    <div>
                        <span className="text-slate-500">Received </span>
                        {fmtTs(r.receivedDate)}
                    </div>
                    {r.projected.putawayDate && (
                        <div>
                            <span className="text-slate-500">Putaway </span>
                            {fmtTs(r.projected.putawayDate)}
                        </div>
                    )}
                </div>
            );
        }
        case "allocation": {
            const a = projection.allocations.find((a) => a.id === id);
            if (!a) return null;
            return (
                <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Allocation</p>
                    <div className="font-semibold text-white">{a.id}</div>
                    <div className="text-slate-400 text-[11px]">{a.itemId}</div>
                    <div>
                        <span className="text-slate-500">Allocated </span>
                        {a.quantityAllocated} / {a.quantityRequired} {a.uom}
                        {a.status === "partial" && <span className="ml-1.5 text-amber-400">partial</span>}
                    </div>
                    <div>
                        <span className="text-slate-500">From </span>
                        {fmtTs(a.allocatedAt)}
                    </div>
                    <div>
                        <span className="text-slate-500">Until </span>
                        {a.clearedAt ? fmtTs(a.clearedAt) : "—"}
                    </div>
                </div>
            );
        }
        case "pickTask": {
            const t = projection.pickTasks.find((t) => t.id === id);
            if (!t) return null;
            return (
                <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Pick Task</p>
                    <div className="font-semibold text-white">{t.id}</div>
                    <div className="text-slate-400 text-[11px]">{t.itemId}</div>
                    <div>
                        <span className="text-slate-500">Status </span>
                        <span className="capitalize">{t.status}</span>
                    </div>
                    <div>
                        <span className="text-slate-500">Qty </span>
                        {t.quantity} {t.uom}
                    </div>
                    {t.pickedDate && (
                        <div>
                            <span className="text-slate-500">Picked </span>
                            {fmtTs(t.pickedDate)}
                        </div>
                    )}
                </div>
            );
        }
        case "putawayTask": {
            const t = projection.putawayTasks.find((t) => t.id === id);
            if (!t) return null;
            return (
                <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Putaway Task</p>
                    <div className="font-semibold text-white">{t.id}</div>
                    <div className="text-slate-400 text-[11px]">{t.itemId}</div>
                    <div>
                        <span className="text-slate-500">Status </span>
                        <span className="capitalize">{t.status}</span>
                    </div>
                    <div>
                        <span className="text-slate-500">Qty </span>
                        {t.quantity}
                    </div>
                    {t.putawayDate && (
                        <div>
                            <span className="text-slate-500">Putaway </span>
                            {fmtTs(t.putawayDate)}
                        </div>
                    )}
                </div>
            );
        }
        case "purchaseOrder": {
            const po = projection.purchaseOrders.find((p) => p.id === id);
            if (!po) return null;
            return (
                <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Purchase Order</p>
                    <div className="font-semibold text-white">{po.orderNumber}</div>
                    <div className="text-slate-400 text-[11px]">{po.itemId}</div>
                    <div>
                        <span className="text-slate-500">Supplier </span>
                        {po.supplierName ?? po.supplierId}
                    </div>
                    <div>
                        <span className="text-slate-500">Qty </span>
                        {po.orderedQuantity}
                    </div>
                    <div>
                        <span className="text-slate-500">Ordered </span>
                        {fmtTs(po.orderDate)}
                    </div>
                    {po.expectedDeliveryDate && (
                        <div>
                            <span className="text-slate-500">Expected </span>
                            {fmtTs(po.expectedDeliveryDate)}
                        </div>
                    )}
                    {po.receivedAt && (
                        <div>
                            <span className="text-slate-500">Received </span>
                            {fmtTs(po.receivedAt)}
                        </div>
                    )}
                </div>
            );
        }
    }
}

//------------------------------------------------------------------------------
// Main component
//------------------------------------------------------------------------------
export function Timeline() {
    const { selectedNode } = useContext(SelectionContext);
    const { nodeList } = useContext(FactoryContext);

    //--------------------------------------------------------------------------
    const { hovered, setSelected } = useFocusStore();
    const { asOf, setAsOf, present, isPlaying, play, pause, playbackSpeed, setPlaybackSpeed, timelineWindow, setZoom } =
        useTimelineStore();
    const { activeScenarioId } = useContext(ScenarioContext);

    useEffect(() => {
        const { itemSlug } = Router.currentRoute();
        if (!itemSlug) return;
        const type = entityTypeFromId(itemSlug);
        if (type) setSelected({ type, id: itemSlug });
    }, [setSelected]);
    const { scope, level, isLoading } = useScope(selectedNode ?? null);
    const span = useTimelineStore((s) => s.span);

    //--------------------------------------------------------------------------
    const areaType: AreaType | undefined = useMemo(() => {
        if (level !== "area" || !selectedNode || !isArea(selectedNode)) return undefined;
        if ((scope?.productionOrders.length ?? 0) > 0) return "production";
        const name = selectedNode.name.toLowerCase();
        if (name === "delivery") return "delivery";
        if (name === "reception") return "reception";
        if (name === "storage") return "storage";
        return undefined;
    }, [selectedNode, scope, level]);

    //--------------------------------------------------------------------------
    const correlationEnabled = !(
        level === "area" &&
        areaType !== "reception" &&
        areaType !== "storage" &&
        areaType !== "production" &&
        areaType !== "delivery"
    );

    //--------------------------------------------------------------------------
    const activeFocus = correlationEnabled ? hovered : null;
    const correlated = useCorrelation(scope, activeFocus);

    // Tick at each second boundary on the wall clock.
    // Uses getState() to avoid stale closure — no deps needed.
    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;
        const tick = () => {
            const s = useTimelineStore.getState();
            if (s.isPlaying) {
                s.setPresent(Math.floor(Date.now() / 1000));
                if (s.asOf !== undefined) s.setAsOf(s.asOf + s.playbackSpeed);
            }
            timeoutId = setTimeout(tick, 1000 - (Date.now() % 1000));
        };
        timeoutId = setTimeout(tick, 1000 - (Date.now() % 1000));
        return () => clearTimeout(timeoutId);
    }, []);

    const [tooltip, setTooltip] = useState<{ entityType: EntityType; id: string; x: number; y: number } | null>(null);

    const trackRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    //--------------------------------------------------------------------------
    const zoomDef = timelineWindow.kind === "zoom" ? ZOOMS.find((z) => z.key === timelineWindow.key)! : null;
    const winStart = timelineWindow.kind === "zoom" ? present - zoomDef!.days * 86400 : timelineWindow.from;
    const winEnd = timelineWindow.kind === "zoom" ? present + (zoomDef!.days * 86400) / 2 : timelineWindow.to;
    const effectiveNow = asOf ?? present;

    //--------------------------------------------------------------------------
    const stories = useMemo(
        () => (level && span ? buildStories(level, scope, span.window.origin, areaType, selectedNode?.hash) : []),
        [level, scope, span, areaType, selectedNode],
    );

    const showMaintenanceBands = level !== "area" || areaType === "production";

    const allDowntimeBars = useMemo(
        () => (span ? buildDowntimesStory(span.sortedDowntimes, nodeList) : []),
        [span, nodeList],
    );

    const allWorkOrderBars = useMemo(() => (span ? buildWorkOrdersStory(span.sortedWorkOrders) : []), [span]);

    const downtimeBands = useMemo(
        () => (showMaintenanceBands ? allDowntimeBars.filter((bar) => bar.end > winStart && bar.start < winEnd) : []),
        [allDowntimeBars, showMaintenanceBands, winStart, winEnd],
    );

    const workOrderBands = useMemo(
        () => (showMaintenanceBands ? allWorkOrderBars.filter((bar) => bar.end > winStart && bar.start < winEnd) : []),
        [allWorkOrderBars, showMaintenanceBands, winStart, winEnd],
    );

    const scopedDowntimeIds = useMemo(() => new Set(scope?.downtimeEvents.map((dt) => dt.id) ?? []), [scope]);
    const scopedWorkOrderIds = useMemo(() => new Set(scope?.eamWorkOrders.map((wo) => wo.id) ?? []), [scope]);
    const tickDays = zoomDef?.days ?? Math.ceil((winEnd - winStart) / 86400);
    const ticks = useMemo(() => buildTicks(winStart, winEnd, tickDays), [winStart, winEnd, tickDays]);
    const closedIntervals = useMemo(() => buildClosedIntervals(winStart, winEnd), [winStart, winEnd]);
    const presentPct = toPct(present, winStart, winEnd);
    const playheadPct = Math.max(0, Math.min(100, toPct(asOf || present, winStart, winEnd)));
    const totalH =
        AXIS_H +
        ROW_GAP +
        stories.reduce((sum, s) => sum + s.lanes.length * (s.barStyle === "bar" ? ROW_H : ROW_H_LINE) + ROW_GAP, 0);

    //--------------------------------------------------------------------------
    // Seek interaction
    const getPctFromClientX = useCallback((clientX: number): number => {
        const el = trackRef.current;
        if (!el) return 0;
        const rect = el.getBoundingClientRect();
        return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    }, []);

    //--------------------------------------------------------------------------
    const seek = useCallback(
        (clientX: number) => setAsOf(Math.round(fromPct(getPctFromClientX(clientX), winStart, winEnd))),
        [getPctFromClientX, winStart, winEnd, setAsOf],
    );

    //--------------------------------------------------------------------------
    const handleTrackMouseDown = useCallback(
        (e: ReactMouseEvent) => {
            if (e.button !== 0) return;
            e.preventDefault();
            isDragging.current = true;
            setTooltip(null);
            seek(e.clientX);
            const onMove = (ev: MouseEvent) => seek(ev.clientX);
            const onUp = () => {
                isDragging.current = false;
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("mouseup", onUp);
            };
            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onUp);
        },
        [seek],
    );

    //--------------------------------------------------------------------------
    const handleTrackTouchStart = useCallback(
        (e: ReactTouchEvent) => {
            const touch = e.touches[0];
            if (!touch) return;
            e.preventDefault();
            isDragging.current = true;
            setTooltip(null);
            seek(touch.clientX);
            const onMove = (ev: TouchEvent) => {
                const t = ev.touches[0];
                if (t) seek(t.clientX);
                ev.preventDefault();
            };
            const onEnd = () => {
                isDragging.current = false;
                window.removeEventListener("touchmove", onMove);
                window.removeEventListener("touchend", onEnd);
            };
            window.addEventListener("touchmove", onMove, { passive: false });
            window.addEventListener("touchend", onEnd);
        },
        [seek],
    );

    //--------------------------------------------------------------------------
    // Tooltip
    const showTooltip = useCallback((entityType: EntityType, id: string, e: ReactMouseEvent) => {
        if (!isDragging.current) setTooltip({ entityType, id, x: e.clientX, y: e.clientY });
    }, []);

    //--------------------------------------------------------------------------
    const hideTooltip = useCallback(() => setTooltip(null), []);

    //--------------------------------------------------------------------------
    const trackMouseMove = useCallback((e: ReactMouseEvent) => {
        if (!isDragging.current) setTooltip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : null));
    }, []);

    //--------------------------------------------------------------------------
    const tooltipContent = useMemo(() => {
        if (tooltip) {
            return createPortal(
                <div
                    className="fixed z-9999 pointer-events-none"
                    style={{
                        ...(tooltip.x > window.innerWidth * 0.6
                            ? { right: window.innerWidth - tooltip.x + 14 }
                            : { left: tooltip.x + 14 }),
                        ...(tooltip.y > window.innerHeight * 0.65
                            ? { bottom: window.innerHeight - tooltip.y + 8 }
                            : { top: tooltip.y - 8 }),
                    }}
                >
                    <div className="bg-slate-900/95 border border-slate-700/60 rounded-lg px-3 py-2.5 shadow-xl text-slate-300 text-xs max-w-64">
                        <TimelineTooltip entityType={tooltip.entityType} id={tooltip.id} />
                    </div>
                </div>,
                document.body,
            );
        }
    }, [tooltip]);

    //--------------------------------------------------------------------------
    return (
        <>
            <aside
                data-scenario="corrective-maintenance-step-6 predictive-maintenance-step-6 tour-guide-5"
                className={cn(
                    "flex flex-col pointer-events-auto border-b border-slate-200 select-none",
                    PERFORMANCE_MODE ? "bg-slate-0/97" : "bg-slate-0/80 backdrop-blur-xl",
                )}
            >
                {/* Body */}
                <div className="flex grow">
                    {/* Label column */}
                    <div
                        className="shrink-0 w-30 border-r border-slate-200/30 flex flex-col"
                        style={{ paddingTop: AXIS_H + ROW_GAP }}
                    >
                        {stories.map((story) => (
                            <div
                                key={story.id}
                                className="flex items-center px-2 shrink-0 justify-end"
                                style={{
                                    height: story.lanes.length * (story.barStyle === "bar" ? ROW_H : ROW_H_LINE),
                                    marginBottom: ROW_GAP,
                                }}
                            >
                                <span
                                    className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 truncate"
                                    title={story.title}
                                >
                                    {story.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Track */}
                    <div
                        ref={trackRef}
                        className="flex-1 relative overflow-hidden cursor-crosshair"
                        onMouseDown={handleTrackMouseDown}
                        onMouseMove={trackMouseMove}
                        onMouseLeave={hideTooltip}
                        onTouchStart={handleTrackTouchStart}
                    >
                        {/* Bands — wrapped in mx-1 to align with swimlane margins; top offset skips the axis row */}
                        <div className="absolute inset-x-0 bottom-0 mx-1" style={{ top: AXIS_H }}>
                            {/* Closed-period bands (nighttime + weekends) */}
                            {closedIntervals.map(({ start, end }) => {
                                const left = toPct(start, winStart, winEnd);
                                const width = toPct(end, winStart, winEnd) - left;
                                return (
                                    <div
                                        key={start}
                                        className="absolute top-0 bottom-0 bg-slate-100 pointer-events-none"
                                        style={{ left: `${left}%`, width: `${width}%` }}
                                    />
                                );
                            })}

                            {/* Work order bands */}
                            <div data-scenario="predictive-maintenance-step-5" className="contents">
                                {workOrderBands.map((bar) => (
                                    <Band
                                        key={bar.id}
                                        bar={bar}
                                        isInScope={scopedWorkOrderIds.has(bar.id)}
                                        winStart={winStart}
                                        winEnd={winEnd}
                                        onEnter={showTooltip}
                                        onLeave={hideTooltip}
                                        effectiveNow={effectiveNow}
                                        highlightState={highlightStateForBar(
                                            bar.id,
                                            "workOrder",
                                            activeFocus,
                                            correlated,
                                        )}
                                    />
                                ))}
                            </div>

                            {/* Downtime bands */}
                            {downtimeBands.map((bar) => (
                                <Band
                                    key={bar.id}
                                    bar={bar}
                                    isInScope={scopedDowntimeIds.has(bar.id)}
                                    winStart={winStart}
                                    winEnd={winEnd}
                                    onEnter={showTooltip}
                                    onLeave={hideTooltip}
                                    effectiveNow={effectiveNow}
                                    highlightState={highlightStateForBar(bar.id, "downtime", activeFocus, correlated)}
                                />
                            ))}
                        </div>
                        {/* end bands wrapper */}

                        {/* Axis */}
                        <div className="relative pointer-events-none" style={{ height: AXIS_H }}>
                            {ticks.map((tick) => {
                                const pct = toPct(tick.ts, winStart, winEnd);
                                if (pct < 0 || pct > 100) return null;
                                return (
                                    <div
                                        key={tick.ts}
                                        className="absolute top-0"
                                        style={{ left: `${pct}%`, height: totalH }}
                                    >
                                        <div
                                            className={cn(
                                                "absolute top-0 w-px",
                                                tick.major ? "bg-slate-300/20" : "bg-slate-300/10",
                                            )}
                                            style={{ height: totalH }}
                                        />
                                        <span
                                            className={cn(
                                                "absolute top-1 left-1 whitespace-nowrap",
                                                tick.major
                                                    ? "text-[10px] font-medium text-slate-300"
                                                    : "text-[9px] text-slate-500",
                                            )}
                                        >
                                            {tick.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Story rows */}
                        {stories.map((story) => (
                            <div
                                key={story.id}
                                className="relative mx-1 bg-white/[0.035] rounded-sm pointer-events-none"
                                style={{
                                    height: story.lanes.length * (story.barStyle === "bar" ? ROW_H : ROW_H_LINE),
                                    marginBottom: ROW_GAP,
                                }}
                            >
                                {story.lanes.map((lane, laneIdx) =>
                                    lane.map((bar) => (
                                        <Bar
                                            key={bar.id}
                                            bar={bar}
                                            winStart={winStart}
                                            winEnd={winEnd}
                                            laneIndex={laneIdx}
                                            barStyle={story.barStyle}
                                            effectiveNow={effectiveNow}
                                            highlightState={highlightStateForBar(
                                                bar.id,
                                                bar.entityType,
                                                activeFocus,
                                                correlated,
                                            )}
                                            onEnter={showTooltip}
                                            onLeave={hideTooltip}
                                        />
                                    )),
                                )}
                            </div>
                        ))}

                        {/* Future zone tint */}
                        {!activeScenarioId && presentPct >= 0 && presentPct <= 100 && (
                            <div
                                className="absolute top-0 bottom-0 bg-white/[0.025] pointer-events-none"
                                style={{ left: `${presentPct}%`, right: 0 }}
                            />
                        )}

                        {/* Now marker */}
                        {presentPct >= 0 && presentPct <= 100 && (
                            <div
                                className="absolute top-0 bottom-0 w-px bg-accent/50 pointer-events-none"
                                style={{ left: `${presentPct}%` }}
                            >
                                <span className="absolute top-1 left-1 text-[9px] font-bold text-accent whitespace-nowrap">
                                    NOW
                                </span>
                            </div>
                        )}

                        {/* Playhead */}
                        {!activeScenarioId && (
                            <div
                                className="absolute top-0 bottom-0 z-20 cursor-ew-resize"
                                style={{ left: `${playheadPct}%` }}
                                onMouseDown={handleTrackMouseDown}
                            >
                                <div className="absolute top-1 -translate-x-1/2 w-3 h-3 rounded-full bg-accent border-2 border-white/90 shadow-md" />
                                <div className="absolute top-3.5 bottom-0 w-px -translate-x-1/2 bg-accent shadow-[0_0_6px_var(--color-accent)]" />
                            </div>
                        )}

                        {/* Loading overlay */}
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-[10px] text-slate-400 animate-pulse">Loading…</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Header */}
                <div className="flex items-center pr-3 h-8">
                    <div className="flex items-center gap-0.5">
                        {ZOOMS.map((z) => (
                            <button
                                key={z.key}
                                onClick={() => setZoom(z.key)}
                                className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide transition-colors",
                                    timelineWindow.kind === "zoom" && timelineWindow.key === z.key
                                        ? "bg-accent/20 text-accent"
                                        : "text-slate-400 hover:text-slate-200",
                                )}
                            >
                                {z.label}
                            </button>
                        ))}
                    </div>
                    <div className="grow" />
                    <div className="flex items-center gap-2">
                        {/* Play / pause */}
                        <button
                            onClick={isPlaying ? pause : play}
                            className="text-[11px] w-3.5 text-center text-slate-400 hover:text-slate-200 transition-colors"
                            title={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? "⏸" : "▶"}
                        </button>

                        <div className="flex items-center gap-0.5">
                            {PLAYBACK_SPEEDS.map((speed) => (
                                <button
                                    key={speed}
                                    onClick={() => {
                                        if (asOf === undefined) setAsOf(present);
                                        setPlaybackSpeed(speed as PlaybackSpeed);
                                    }}
                                    className={cn(
                                        "px-1 py-0.5 rounded text-[9px] font-semibold transition-colors",
                                        playbackSpeed === speed
                                            ? "bg-accent/20 text-accent"
                                            : "text-slate-500 hover:text-slate-300",
                                    )}
                                >
                                    {speed}×
                                </button>
                            ))}
                        </div>

                        {/* Reset to live */}
                        {asOf !== undefined && (
                            <button
                                onClick={() => {
                                    setAsOf(undefined);
                                    setPlaybackSpeed(1);
                                }}
                                className="text-[9px] font-semibold uppercase tracking-wide text-accent/80 hover:text-accent transition-colors"
                                title="Reset to now"
                            >
                                ↺ now
                            </button>
                        )}

                        <span className="text-[10px] font-mono text-slate-300 tabular-nums">
                            {fmtTs(asOf || present, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                            })}
                        </span>
                    </div>
                    <FooterTabs className="ml-2" />
                </div>
            </aside>
            {tooltipContent}
        </>
    );
}
