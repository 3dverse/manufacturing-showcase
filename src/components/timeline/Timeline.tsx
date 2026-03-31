import { useContext, useMemo, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";

//------------------------------------------------------------------------------
import { SelectionContext } from "@/contexts/SelectionContext";

//------------------------------------------------------------------------------
import { useTimelineStore } from "@/store/useTimelineStore";
import { useFocusStore } from "@/store/useFocusStore";

//------------------------------------------------------------------------------
import { highlightStateForBar, type EntityType, type HighlightState } from "@/core/Correlation";
import { isArea } from "@/core/NavGraph";
import type { TimelineLevel } from "@/core/Scope";

import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import { useScope } from "@/hooks/useScope";
import { useProjection } from "@/hooks/useProjection";
import { useCorrelation } from "@/hooks/useCorrelation";
import { CorrelationModal } from "@/components/correlation/CorrelationModal";

//------------------------------------------------------------------------------
import { fmtDuration, fmtTs, fromPct, toPct } from "./timeUtils";

//------------------------------------------------------------------------------
import { PERFORMANCE_MODE, FULL_TIMELINE } from "@/content/3dverse";
import type {
    AsOfProjection,
    ProjectedSalesOrder,
    ProjectedProductionOrder,
    ProjectedOperation,
    ProjectedDowntime,
    ProjectedWorkOrder,
    ProjectedReceipt,
    ProjectedAllocation,
    ProjectedPickTask,
    ProjectedPutawayTask,
    ProjectedPurchaseOrder,
} from "@/core/Projection";

//------------------------------------------------------------------------------
// Zoom levels
//------------------------------------------------------------------------------

type ZoomKey = "1D" | "1W" | "2W" | "1M" | "3M" | "6M";

type AreaType = "production" | "delivery" | "reception" | "storage" | "other";

const ZOOMS: { key: ZoomKey; label: string; days: number }[] = [
    { key: "1D", label: "1D", days: 1 },
    { key: "1W", label: "1W", days: 7 },
    { key: "2W", label: "2W", days: 14 },
    { key: "1M", label: "1M", days: 30 },
    { key: "3M", label: "3M", days: 90 },
    //{ key: "6M", label: "6M", days: 180 },
];

//------------------------------------------------------------------------------
// Layout constants
//------------------------------------------------------------------------------

const AXIS_H = 22;
const ROW_H = 22;
const ROW_H_LINE = 8;
const ROW_GAP = 4;
const BAR_H = 12;

//------------------------------------------------------------------------------
// Axis tick generation
//------------------------------------------------------------------------------

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

type BarItem = {
    id: string;
    entityType: EntityType;
    start: number;
    end: number;
    className: string;
    tooltip: React.ReactNode;
};

type BarStyle = "bar" | "line";
type StackingStyle = "swimlane" | "overlap";

type Story = {
    id: string;
    label: string;
    lanes: BarItem[][];
    barStyle: BarStyle;
    stackingStyle: StackingStyle;
    rowHeight: number;
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

function buildSalesOrdersStory(orders: ProjectedSalesOrder[]): Story {
    const bars: BarItem[] = orders.map((so) => ({
        id: so.id,
        entityType: "salesOrder" as EntityType,
        start: so.orderDate,
        end: so.requestedDeliveryDate,
        className: cn(
            "hover:ring-2 hover:ring-offset-0 hover:ring-accent/50",
            so.phase === "active" ? "bg-accent" : so.phase === "completed" ? "bg-accent/70" : "bg-accent/40",
        ),
        tooltip: (
            <div className="space-y-1.5">
                <div className="font-semibold text-white">{so.orderNumber}</div>
                <div>
                    <span className="text-slate-500">Status </span>
                    <span className="capitalize">{so.status.replace("_", " ")}</span>
                    {so.isOverdue && <span className="ml-1.5 text-red-400">overdue</span>}
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
        ),
    }));
    return {
        id: "sales",
        label: "Sales Orders",
        lanes: buildLanes(bars, "swimlane"),
        barStyle: "line",
        stackingStyle: "swimlane",
        rowHeight: ROW_H_LINE,
    };
}

function buildProductionOrdersStory(orders: ProjectedProductionOrder[]): Story {
    const bars: BarItem[] = orders.map((po) => {
        const slip =
            po.timing.actualEnd && po.timing.actualEnd > po.timing.scheduledEnd
                ? po.timing.actualEnd - po.timing.scheduledEnd
                : 0;
        return {
            id: po.id,
            entityType: "productionOrder" as EntityType,
            start: po.effectiveStart,
            end: po.effectiveEnd,
            className:
                po.phase === "completed"
                    ? "bg-emerald-500/40 border border-emerald-400/40 hover:ring-2 hover:ring-offset-0 hover:ring-emerald-500/50"
                    : po.phase === "future"
                      ? "bg-blue-400/25 border border-blue-400/60 border-dashed hover:ring-2 hover:ring-offset-0 hover:ring-blue-400/50"
                      : "bg-emerald-500/60 border border-emerald-400/70 hover:ring-2 hover:ring-offset-0 hover:ring-emerald-500/50",
            tooltip: (
                <div className="space-y-1.5">
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
                        {po.phase === "active" && (
                            <span className="ml-1 text-slate-400">({Math.round(po.estimatedProgress * 100)}%)</span>
                        )}
                    </div>
                    {slip > 0 && <div className="text-amber-400">Slip +{fmtDuration(slip)}</div>}
                </div>
            ),
        };
    });
    return {
        id: "production",
        label: "Production orders",
        lanes: buildLanes(bars, "swimlane"),
        barStyle: "bar",
        stackingStyle: "swimlane",
        rowHeight: ROW_H,
    };
}

function buildOperationsStory(ops: ProjectedOperation[]): Story {
    const bars: BarItem[] = ops.map((op) => {
        const slip = op.actualEnd && op.actualEnd > op.scheduledEnd ? op.actualEnd - op.scheduledEnd : 0;
        return {
            id: op.id,
            entityType: "operation" as EntityType,
            start: op.effectiveStart,
            end: op.effectiveEnd,
            className:
                op.phase === "completed"
                    ? "bg-slate-400/50 border border-slate-300/40 hover:ring-2 hover:ring-offset-0 hover:ring-slate-400/50"
                    : op.phase === "future"
                      ? "bg-blue-400/25 border border-blue-400/60 border-dashed hover:ring-2 hover:ring-offset-0 hover:ring-blue-400/50"
                      : "bg-emerald-500/60 border border-emerald-400/70 hover:ring-2 hover:ring-offset-0 hover:ring-emerald-500/50",
            tooltip: (
                <div className="space-y-1.5">
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
                    {op.phase === "active" && (
                        <div>
                            <span className="text-slate-500">Progress </span>
                            {Math.round(op.estimatedProgress * 100)}%
                        </div>
                    )}
                    {slip > 0 && <div className="text-amber-400">Slip +{fmtDuration(slip)}</div>}
                </div>
            ),
        };
    });
    return {
        id: "operations",
        label: "Operations",
        lanes: buildLanes(bars, "overlap"),
        barStyle: "bar",
        stackingStyle: "overlap",
        rowHeight: ROW_H,
    };
}

function buildStoppagesStory(events: ProjectedDowntime[], workOrders: ProjectedWorkOrder[]): Story {
    const dtBars: BarItem[] = events.map((dt) => ({
        id: dt.id,
        entityType: "downtime" as EntityType,
        start: dt.startedAt,
        end: dt.endedAt ?? Math.floor(Date.now() / 1000),
        className: cn(
            "border border-red-400/40 hover:ring-2 hover:ring-offset-0 hover:ring-red-500/50",
            dt.isOngoing ? "bg-red-500/70" : "bg-red-500/55",
        ),
        tooltip: (
            <div className="space-y-1.5">
                <div className="font-semibold text-red-300">
                    {dt.reasonCode}
                    {dt.isOngoing && <span className="ml-1.5 text-[10px] text-red-400/80">ongoing</span>}
                </div>
                {dt.reasonDescription && <div className="text-slate-400 text-[11px]">{dt.reasonDescription}</div>}
                <div>
                    <span className="text-slate-500">Start </span>
                    {fmtTs(dt.startedAt)}
                </div>
                <div>
                    <span className="text-slate-500">Duration </span>
                    {fmtDuration(dt.durationAtAsOf)}
                </div>
            </div>
        ),
    }));

    const woBars: BarItem[] = workOrders.map((wo) => ({
        id: wo.id,
        entityType: "workOrder" as EntityType,
        start: wo.effectiveStart,
        end: wo.effectiveEnd,
        className:
            wo.phase === "completed"
                ? "bg-amber-500/50 border border-amber-400/50 hover:ring-2 hover:ring-offset-0 hover:ring-amber-500/50"
                : wo.isOverdue
                  ? "bg-amber-500/70 border border-amber-400/80 hover:ring-2 hover:ring-offset-0 hover:ring-amber-500/50"
                  : "bg-amber-500/50 border border-amber-400/50 hover:ring-2 hover:ring-offset-0 hover:ring-amber-500/50",
        tooltip: (
            <div className="space-y-1.5">
                <div className="font-semibold text-white">{wo.workOrderNumber}</div>
                <div className="text-slate-400 text-[11px] capitalize">{wo.workType}</div>
                <div>
                    <span className="text-slate-500">Status </span>
                    <span className="capitalize">{wo.status.replace("_", " ")}</span>
                    {wo.isOverdue && <span className="ml-1.5 text-red-400">overdue</span>}
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
        ),
    }));

    return {
        id: "stoppages",
        label: "Stoppages",
        lanes: buildLanes([...dtBars, ...woBars], "overlap"),
        barStyle: "bar",
        stackingStyle: "swimlane",
        rowHeight: ROW_H,
    };
}

function buildReceiptsStory(receipts: ProjectedReceipt[]): Story {
    const bars: BarItem[] = receipts.map((r) => {
        const end = r.putawayDate ?? Math.floor(Date.now() / 1000);
        return {
            id: r.id,
            entityType: "receipt" as EntityType,
            start: r.receivedDate,
            end: end > r.receivedDate ? end : r.receivedDate + 3600,
            className: cn(
                "hover:ring-2 hover:ring-offset-0 hover:ring-sky-500/50",
                r.phase === "completed"
                    ? "bg-sky-500/50 border border-sky-400/50"
                    : r.phase === "future"
                      ? "bg-slate-400/30 border border-slate-400/40 border-dashed"
                      : "bg-amber-400/60 border border-amber-300/60",
            ),
            tooltip: (
                <div className="space-y-1.5">
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
                    {r.putawayDate && (
                        <div>
                            <span className="text-slate-500">Putaway </span>
                            {fmtTs(r.putawayDate)}
                        </div>
                    )}
                </div>
            ),
        };
    });
    return {
        id: "receipts",
        label: "Receipts",
        lanes: buildLanes(bars, "swimlane"),
        barStyle: "bar",
        stackingStyle: "swimlane",
        rowHeight: ROW_H,
    };
}

function buildAllocationsStory(allocs: ProjectedAllocation[], demandType: "production_order" | "sales_order"): Story {
    const now = Math.floor(Date.now() / 1000);
    const filtered = allocs.filter((a) => a.demandType === demandType);
    const isRM = demandType === "production_order";
    const bars: BarItem[] = filtered.map((a) => ({
        id: a.id,
        entityType: "allocation" as EntityType,
        start: a.allocatedAt,
        end: a.clearedAt ?? now,
        className: cn(
            "hover:ring-2 hover:ring-offset-0 hover:ring-blue-400/50",
            a.status === "partial"
                ? "bg-blue-400/35 border border-blue-400/50 border-dashed"
                : "bg-blue-400/60 border border-blue-400/60",
        ),
        tooltip: (
            <div className="space-y-1.5">
                <div className="font-semibold text-white">{a.id}</div>
                <div className="text-slate-400 text-[11px]">{a.itemId}</div>
                <div>
                    <span className="text-slate-500">Allocated </span>
                    {a.quantityAllocated} / {a.quantityRequired} {a.uom}
                    {a.status === "partial" && <span className="ml-1.5 text-amber-400">partial</span>}
                </div>
                <div>
                    <span className="text-slate-500">Since </span>
                    {fmtTs(a.allocatedAt)}
                </div>
            </div>
        ),
    }));
    return {
        id: isRM ? "alloc-rm" : "alloc-fg",
        label: isRM ? "RM allocations" : "FG allocations",
        lanes: buildLanes(bars, "swimlane"),
        barStyle: "line",
        stackingStyle: "swimlane",
        rowHeight: ROW_H_LINE,
    };
}

function buildPickTasksStory(tasks: ProjectedPickTask[]): Story {
    const now = Math.floor(Date.now() / 1000);
    const bars: BarItem[] = tasks.map((t) => ({
        id: t.id,
        entityType: "pickTask" as EntityType,
        start: t.createdAt,
        end: t.pickedDate ?? now,
        className: cn(
            "hover:ring-2 hover:ring-offset-0 hover:ring-amber-400/50",
            t.phase === "completed"
                ? "bg-amber-400/50 border border-amber-300/50"
                : t.phase === "future"
                  ? "bg-slate-400/30 border border-slate-400/40 border-dashed"
                  : "bg-amber-300/40 border border-amber-300/50",
        ),
        tooltip: (
            <div className="space-y-1.5">
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
        ),
    }));
    return {
        id: "pick-tasks",
        label: "Pick tasks",
        lanes: buildLanes(bars, "swimlane"),
        barStyle: "bar",
        stackingStyle: "swimlane",
        rowHeight: ROW_H,
    };
}

function buildPutawayTasksStory(tasks: ProjectedPutawayTask[]): Story {
    console.log("tasks", tasks);
    const now = Math.floor(Date.now() / 1000);
    const bars: BarItem[] = tasks.map((t) => ({
        id: t.id,
        entityType: "putawayTask" as EntityType,
        start: t.createdAt,
        end: t.putawayDate ?? now,
        className: cn(
            "hover:ring-2 hover:ring-offset-0 hover:ring-emerald-400/50",
            t.phase === "completed"
                ? "bg-emerald-500/50 border border-emerald-400/50"
                : t.phase === "future"
                  ? "bg-slate-400/30 border border-slate-400/40 border-dashed"
                  : "bg-emerald-400/40 border border-emerald-300/50",
        ),
        tooltip: (
            <div className="space-y-1.5">
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
        ),
    }));
    return {
        id: "putaway-tasks",
        label: "Putaway tasks",
        lanes: buildLanes(bars, "swimlane"),
        barStyle: "bar",
        stackingStyle: "swimlane",
        rowHeight: ROW_H,
    };
}

function buildPurchaseOrdersStory(pos: ProjectedPurchaseOrder[]): Story {
    const bars: BarItem[] = pos.map((po) => {
        const end = po.receivedAt ?? po.expectedDeliveryDate ?? Math.floor(Date.now() / 1000);
        return {
            id: po.id,
            entityType: "purchaseOrder" as EntityType,
            start: po.orderDate,
            end: end > po.orderDate ? end : po.orderDate + 3600,
            className: cn(
                "hover:ring-2 hover:ring-offset-0 hover:ring-violet-500/50",
                po.phase === "completed"
                    ? "bg-violet-500/50 border border-violet-400/50"
                    : po.phase === "future"
                      ? "bg-slate-400/30 border border-slate-400/40 border-dashed"
                      : "bg-violet-400/40 border border-violet-300/50",
            ),
            tooltip: (
                <div className="space-y-1.5">
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
            ),
        };
    });
    return {
        //asd
        id: "purchase-orders",
        label: "Purchase orders",
        lanes: buildLanes(bars, "swimlane"),
        barStyle: "line",
        stackingStyle: "swimlane",
        rowHeight: ROW_H_LINE,
    };
}

//------------------------------------------------------------------------------
// Story selection
//------------------------------------------------------------------------------

function buildStories(level: TimelineLevel, projection: AsOfProjection | null, areatype?: AreaType): Story[] {
    const so = projection?.salesOrders ?? [];
    const po = projection?.productionOrders ?? [];
    const ops = projection?.operations ?? [];
    const dt = projection?.downtimeEvents ?? [];
    const wo = projection?.eamWorkOrders ?? [];

    const rcp = projection?.receipts ?? [];
    const alloc = projection?.allocations ?? [];
    const picks = projection?.pickTasks ?? [];
    const putaways = projection?.putawayTasks ?? [];
    const purchaseOrders = projection?.purchaseOrders ?? [];

    switch (level) {
        case "factory":
            return [buildSalesOrdersStory(so)];
        case "area":
            switch (areatype) {
                case "production":
                    return [buildSalesOrdersStory(so), buildProductionOrdersStory(po)];
                case "delivery":
                    return [
                        buildSalesOrdersStory(so),
                        buildAllocationsStory(alloc, "sales_order"),
                        ...(FULL_TIMELINE ? [buildPickTasksStory(picks)] : []),
                    ];
                case "reception":
                    return [
                        buildPurchaseOrdersStory(purchaseOrders),
                        buildReceiptsStory(rcp),
                        ...(FULL_TIMELINE ? [buildPutawayTasksStory(putaways)] : []),
                    ];
                case "storage":
                    return [buildSalesOrdersStory(so), buildAllocationsStory(alloc, "production_order")];
                default:
                    return [buildSalesOrdersStory(so)];
            }
        case "line":
        case "cell":
            return [buildProductionOrdersStory(po), buildOperationsStory(ops), buildStoppagesStory(dt, wo)];
        case "machine":
            return [buildProductionOrdersStory(po), buildOperationsStory(ops), buildStoppagesStory(dt, wo)];
    }
}

//------------------------------------------------------------------------------
// Bar component
//------------------------------------------------------------------------------

const LINE_H = 4;

function Bar({
    bar,
    winStart,
    winEnd,
    laneIndex,
    barStyle,
    rowHeight,
    highlightState,
    onEnter,
    onLeave,
    onFocusEnter,
    onFocusLeave,
    onClick,
}: {
    bar: BarItem;
    winStart: number;
    winEnd: number;
    laneIndex: number;
    barStyle: BarStyle;
    rowHeight: number;
    highlightState: HighlightState;
    onEnter: (content: React.ReactNode, e: React.MouseEvent) => void;
    onLeave: () => void;
    onFocusEnter: () => void;
    onFocusLeave: () => void;
    onClick: () => void;
}) {
    const left = toPct(bar.start, winStart, winEnd);
    const right = toPct(bar.end, winStart, winEnd);
    if (right < 0 || left > 100) return null;

    const clampedLeft = Math.max(0, left);
    const clampedRight = Math.min(100, right);
    const widthPct = Math.max(0.25, clampedRight - clampedLeft);
    const h = barStyle === "line" ? LINE_H : BAR_H;

    return (
        <div
            className={cn(
                "absolute cursor-pointer transition-[shadow,opacity]",
                barStyle === "line" ? "rounded-full" : "rounded-sm",
                highlightState === "dimmed" && "opacity-20",
                bar.className,
            )}
            style={{
                left: `${clampedLeft}%`,
                width: `${widthPct}%`,
                top: laneIndex * rowHeight + (rowHeight - h) / 2,
                height: h,
            }}
            onMouseEnter={(e) => {
                e.stopPropagation();
                onEnter(bar.tooltip, e);
                onFocusEnter();
            }}
            onMouseLeave={(e) => {
                e.stopPropagation();
                onLeave();
                onFocusLeave();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
        />
    );
}

//------------------------------------------------------------------------------
// Main component
//------------------------------------------------------------------------------

export function Timeline({ className }: { className?: string }) {
    const { selectedNode } = useContext(SelectionContext);
    const { asOf, setAsOf } = useTimelineStore();
    const { scope, level, isLoading } = useScope(selectedNode ?? null);
    const projection = useProjection(scope);
    const { hovered, setHovered, setSelected } = useFocusStore();
    const areaType: AreaType | undefined = (() => {
        if (level !== "area" || !selectedNode || !isArea(selectedNode)) return undefined;
        if ((scope?.productionOrders.length ?? 0) > 0) return "production";
        const name = selectedNode.name.toLowerCase();
        if (name === "delivery") return "delivery";
        if (name === "reception") return "reception";
        if (name === "storage") return "storage";
        return undefined;
    })();
    const correlationEnabled = !(
        level === "area" &&
        areaType !== "production" &&
        areaType !== "delivery" &&
        areaType !== "reception" &&
        areaType !== "storage"
    );
    const activeFocus = correlationEnabled ? hovered : null;
    const correlated = useCorrelation(projection, activeFocus);

    const [zoom, setZoom] = useState<ZoomKey>("2W");
    const [tooltip, setTooltip] = useState<{ content: React.ReactNode; x: number; y: number } | null>(null);

    const trackRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    //--------------------------------------------------------------------------
    const refNow = Math.floor(Date.now() / 1000);
    const zoomDef = ZOOMS.find((z) => z.key === zoom)!;
    const halfSecs = (zoomDef.days * 86400) / 2;
    const winStart = refNow - zoomDef.days * 86400;
    const winEnd = refNow + halfSecs;

    //--------------------------------------------------------------------------
    const stories = useMemo(
        () => (level ? buildStories(level, projection, areaType) : []),
        [level, projection, areaType],
    );
    const ticks = useMemo(() => buildTicks(winStart, winEnd, zoomDef.days), [winStart, winEnd, zoomDef.days]);
    const nowPct = toPct(refNow, winStart, winEnd);
    const playheadPct = Math.max(0, Math.min(100, toPct(asOf, winStart, winEnd)));
    const totalH = AXIS_H + ROW_GAP + stories.reduce((sum, s) => sum + s.lanes.length * s.rowHeight + ROW_GAP, 0);

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
        (e: React.MouseEvent) => {
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
    // Tooltip
    const showTooltip = useCallback((content: React.ReactNode, e: React.MouseEvent) => {
        if (!isDragging.current) setTooltip({ content, x: e.clientX, y: e.clientY });
    }, []);
    const hideTooltip = useCallback(() => setTooltip(null), []);
    const trackMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging.current) setTooltip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : null));
    }, []);

    //--------------------------------------------------------------------------
    return (
        <>
            <aside
                className={cn(
                    "pointer-events-auto border-t border-slate-200/15 select-none",
                    PERFORMANCE_MODE ? "bg-slate-0/97" : "bg-slate-0/80 backdrop-blur-xl",
                    className,
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between gap-4 px-3 h-8 border-b border-slate-200/10">
                    <div className="flex items-center gap-0.5">
                        {ZOOMS.map((z) => (
                            <button
                                key={z.key}
                                onClick={() => setZoom(z.key)}
                                className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide transition-colors",
                                    zoom === z.key ? "bg-accent/20 text-accent" : "text-slate-400 hover:text-slate-200",
                                )}
                            >
                                {z.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                        {asOf !== refNow && (
                            <button
                                onClick={() => setAsOf(refNow)}
                                className="text-[9px] font-semibold uppercase tracking-wide text-accent/80 hover:text-accent transition-colors"
                                title="Reset to now"
                            >
                                ↺ now
                            </button>
                        )}
                        <span className="text-[10px] font-mono text-slate-300 tabular-nums">{fmtTs(asOf)}</span>
                    </div>
                </div>

                {/* Body */}
                <div className="flex h-full">
                    {/* Label column */}
                    <div
                        className="shrink-0 w-34 border-r border-slate-200/10 flex flex-col"
                        style={{ paddingTop: AXIS_H + ROW_GAP }}
                    >
                        {stories.map((story) => (
                            <div
                                key={story.id}
                                className="flex items-top px-2 shrink-0 justify-end"
                                style={{ height: story.lanes.length * story.rowHeight, marginBottom: ROW_GAP }}
                            >
                                <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 truncate">
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
                    >
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
                                className="relative mx-1 bg-white/[0.035] rounded-sm"
                                style={{ height: story.lanes.length * story.rowHeight, marginBottom: ROW_GAP }}
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
                                            rowHeight={story.rowHeight}
                                            highlightState={highlightStateForBar(
                                                bar.id,
                                                bar.entityType,
                                                activeFocus,
                                                correlated,
                                            )}
                                            onEnter={showTooltip}
                                            onLeave={hideTooltip}
                                            onFocusEnter={() => setHovered({ type: bar.entityType, id: bar.id })}
                                            onFocusLeave={() => setHovered(null)}
                                            onClick={() => setSelected({ type: bar.entityType, id: bar.id })}
                                        />
                                    )),
                                )}
                            </div>
                        ))}

                        {/* Future zone tint */}
                        {nowPct >= 0 && nowPct <= 100 && (
                            <div
                                className="absolute top-0 bottom-0 bg-white/[0.025] pointer-events-none"
                                style={{ left: `${nowPct}%`, right: 0 }}
                            />
                        )}

                        {/* Now marker */}
                        {nowPct >= 0 && nowPct <= 100 && (
                            <div
                                className="absolute top-0 bottom-0 w-px bg-accent/50 pointer-events-none"
                                style={{ left: `${nowPct}%` }}
                            >
                                <span className="absolute top-1 left-1 text-[9px] font-bold text-accent whitespace-nowrap">
                                    NOW
                                </span>
                            </div>
                        )}

                        {/* Playhead */}
                        <div
                            className="absolute top-0 bottom-0 z-20 cursor-ew-resize"
                            style={{ left: `${playheadPct}%` }}
                            onMouseDown={handleTrackMouseDown}
                        >
                            <div className="absolute top-1 -translate-x-1/2 w-3 h-3 rounded-full bg-accent border-2 border-white/90 shadow-md" />
                            <div className="absolute top-3.5 bottom-0 w-px -translate-x-1/2 bg-accent shadow-[0_0_6px_var(--color-accent)]" />
                        </div>

                        {/* Loading overlay */}
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-[10px] text-slate-400 animate-pulse">Loading…</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tooltip portal */}
                {tooltip &&
                    createPortal(
                        <div
                            className="fixed z-[9999] pointer-events-none"
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
                                {tooltip.content}
                            </div>
                        </div>,
                        document.body,
                    )}
            </aside>
            <CorrelationModal />
        </>
    );
}
