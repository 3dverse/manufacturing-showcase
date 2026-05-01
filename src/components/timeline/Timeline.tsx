import {
    useContext,
    useEffect,
    useMemo,
    useRef,
    useCallback,
    useState,
    type MouseEvent as ReactMouseEvent,
    type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

//------------------------------------------------------------------------------
import { CorrelationModal } from "@/components/correlation/CorrelationModal";

//------------------------------------------------------------------------------
import { useScope } from "@/hooks/useScope";
import { useProjection } from "@/hooks/useProjection";
import { useSpanProjection } from "@/hooks/useSpanProjection";
import { useCorrelation } from "@/hooks/useCorrelation";
import { SelectionContext } from "@/contexts/SelectionContext";
import { useTimelineStore } from "@/store/useTimelineStore";
import { useFocusStore } from "@/store/useFocusStore";
import { ScenarioContext } from "@/contexts/ScenariosContext";

//------------------------------------------------------------------------------
import { highlightStateForBar, entityTypeFromId, type EntityType, type HighlightState } from "@/core/Correlation";
import { Router } from "@/core/Router";
import { isArea } from "@/core/SceneGraph";
import type { TimelineLevel } from "@/core/Scope";
import type {
    AsOfProjection,
    ProjectedSalesOrder,
    ProjectedProductionOrder,
    ProjectedOperation,
    ProjectedReceipt,
    ProjectedAllocation,
    ProjectedPickTask,
    ProjectedPutawayTask,
    ProjectedPurchaseOrder,
} from "@/core/Projection";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";
import { fromPct, toPct } from "./timeUtils";
import { fmtDuration, fmtTs } from "@/utils/helpers-time";
import { buildClosedIntervals } from "@/core/Calendar";

//------------------------------------------------------------------------------
import { PERFORMANCE_MODE, FULL_TIMELINE } from "@/content/3dverse";
import { FooterTabs } from "../common/FooterTabs";

//------------------------------------------------------------------------------
// Zoom levels
//------------------------------------------------------------------------------

import type { ZoomKey } from "@/store/useTimelineStore";

type AreaType = "production" | "delivery" | "reception" | "storage" | "quality" | "other";

const ZOOMS: { key: ZoomKey; label: string; days: number }[] = [
    { key: "1D", label: "1D", days: 1 },
    { key: "1W", label: "1W", days: 7 },
    { key: "2W", label: "2W", days: 14 },
    { key: "1M", label: "1M", days: 30 },
    { key: "3M", label: "3M", days: 90 },
    //{ key: "6M", label: "6M", days: 180 },
];

//------------------------------------------------------------------------------
// Playback speeds
//------------------------------------------------------------------------------

const PLAYBACK_SPEEDS = [1, 60, 300] as const;
type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

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

function buildSalesOrdersStory(orders: ProjectedSalesOrder[]): Story {
    const bars: BarItem[] = orders.map((so) => ({
        id: so.id,
        entityType: "salesOrder" as EntityType,
        start: so.orderDate,
        end: so.requestedDeliveryDate,
        className: cn(
            "hover:ring-2 hover:ring-offset-0 hover:ring-accent/50",
            so.phase === "active" ? "bg-accent" : so.phase === "completed" ? "bg-accent" : "bg-accent",
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
        title: "Sales Orders",
        label: "SO",
        lanes: buildLanes(bars, "swimlane"),
        barStyle: "line",
        stackingStyle: "swimlane",
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
                    ? "bg-emerald-500 border border-emerald-400/40 hover:ring-2 hover:ring-offset-0 hover:ring-emerald-500/50"
                    : po.phase === "future"
                      ? "bg-blue-400 border border-blue-400/60 border-dashed hover:ring-2 hover:ring-offset-0 hover:ring-blue-400/50"
                      : "bg-emerald-500 border border-emerald-400/70 hover:ring-2 hover:ring-offset-0 hover:ring-emerald-500/50",
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
        title: "Manufacturing orders",
        label: "MO",
        lanes: buildLanes(bars, "swimlane"),
        barStyle: "bar",
        stackingStyle: "swimlane",
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
                    ? "bg-slate-400 border border-slate-300/40 hover:ring-2 hover:ring-offset-0 hover:ring-slate-400/50"
                    : op.phase === "future"
                      ? "bg-blue-400 border border-blue-400/60 border-dashed hover:ring-2 hover:ring-offset-0 hover:ring-blue-400/50"
                      : "bg-emerald-500 border border-emerald-400/70 hover:ring-2 hover:ring-offset-0 hover:ring-emerald-500/50",
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
        title: "Operations",
        label: "OP",
        lanes: buildLanes(bars, "swimlane"),
        barStyle: "bar",
        stackingStyle: "swimlane",
    };
}

function buildReceiptsStory(receipts: ProjectedReceipt[], present: number): Story {
    const bars: BarItem[] = receipts.map((r) => {
        const end = r.putawayDate ?? present;
        return {
            id: r.id,
            entityType: "receipt" as EntityType,
            start: r.receivedDate,
            end: end > r.receivedDate ? end : r.receivedDate + 3600,
            className: cn(
                "hover:ring-2 hover:ring-offset-0 hover:ring-sky-500/50",
                r.phase === "completed"
                    ? "bg-sky-500 border border-sky-400/50"
                    : r.phase === "future"
                      ? "bg-slate-400 border border-slate-400/40 border-dashed"
                      : "bg-amber-400 border border-amber-300/60",
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
        label: "RCP",
        title: "Receipts",
        lanes: buildLanes(bars, "swimlane"),
        barStyle: "bar",
        stackingStyle: "swimlane",
    };
}

function buildAllocationsStory(
    allocs: ProjectedAllocation[],
    demandType: "production_order" | "sales_order",
    present: number,
): Story {
    const filtered = allocs.filter((a) => a.demandType === demandType);
    const isRM = demandType === "production_order";
    const bars: BarItem[] = filtered.map((a) => ({
        id: a.id,
        entityType: "allocation" as EntityType,
        start: a.allocatedAt,
        end: a.clearedAt ?? present,
        className: cn(
            "hover:ring-2 hover:ring-offset-0 hover:ring-blue-400/50",
            a.status === "partial"
                ? "bg-blue-400 border border-blue-400/50 border-dashed"
                : "bg-blue-400 border border-blue-400/60",
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
                    <span className="text-slate-500">From </span>
                    {fmtTs(a.allocatedAt)}
                </div>
                <div>
                    <span className="text-slate-500">Until </span>
                    {a.clearedAt ? fmtTs(a.clearedAt) : "—"}
                </div>
            </div>
        ),
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

function buildPickTasksStory(tasks: ProjectedPickTask[], present: number): Story {
    const bars: BarItem[] = tasks.map((t) => ({
        id: t.id,
        entityType: "pickTask" as EntityType,
        start: t.startedAt ?? t.createdAt,
        end: t.pickedDate ?? present,
        className: cn(
            "hover:ring-2 hover:ring-offset-0 hover:ring-amber-400/50",
            t.phase === "completed"
                ? "bg-amber-400 border border-amber-300/50"
                : t.phase === "future"
                  ? "bg-slate-400 border border-slate-400/40 border-dashed"
                  : "bg-amber-300 border border-amber-300/50",
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
        label: "Pickup",
        title: "Pickup tasks",
        lanes: buildLanes(bars, "swimlane"),
        barStyle: "bar",
        stackingStyle: "swimlane",
    };
}

function buildPutawayTasksStory(tasks: ProjectedPutawayTask[], present: number): Story {
    const bars: BarItem[] = tasks.map((t) => ({
        id: t.id,
        entityType: "putawayTask" as EntityType,
        start: t.startedAt ?? t.createdAt,
        end: t.putawayDate ?? present,
        className: cn(
            "hover:ring-2 hover:ring-offset-0 hover:ring-emerald-400/50",
            t.phase === "completed"
                ? "bg-emerald-500 border border-emerald-400/50"
                : t.phase === "future"
                  ? "bg-slate-400 border border-slate-400/40 border-dashed"
                  : "bg-emerald-400 border border-emerald-300/50",
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
        label: "Putaway",
        title: "Putaway Tasks",
        lanes: buildLanes(bars, "swimlane"),
        barStyle: "bar",
        stackingStyle: "swimlane",
    };
}

function buildPurchaseOrdersStory(pos: ProjectedPurchaseOrder[], present: number): Story {
    const bars: BarItem[] = pos.map((po) => {
        const end = po.receivedAt ?? po.expectedDeliveryDate ?? present;
        return {
            id: po.id,
            entityType: "purchaseOrder" as EntityType,
            start: po.orderDate,
            end: end > po.orderDate ? end : po.orderDate + 3600,
            className: cn(
                "hover:ring-2 hover:ring-offset-0 hover:ring-violet-500/50",
                po.phase === "completed"
                    ? "bg-violet-500 border border-violet-400/50"
                    : po.phase === "future"
                      ? "bg-slate-400 border border-slate-400/40 border-dashed"
                      : "bg-violet-400 border border-violet-300/50",
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
        id: "purchase-orders",
        label: "PO",
        title: "Purchase orders",
        lanes: buildLanes(bars, "swimlane"),
        barStyle: "line",
        stackingStyle: "swimlane",
    };
}

//------------------------------------------------------------------------------
// Story selection
//------------------------------------------------------------------------------

function buildStories(
    level: TimelineLevel,
    projection: AsOfProjection | null,
    effectiveNow: number,
    areatype?: AreaType,
    nodeHash?: string,
): Story[] {
    const so = projection?.salesOrders ?? [];
    const po = projection?.productionOrders ?? [];
    const ops = projection?.operations ?? [];

    const rcp = projection?.receipts ?? [];
    const alloc = projection?.allocations ?? [];
    const picks = (projection?.pickTasks ?? []).filter((t) => {
        if (!nodeHash) return true;
        if (areatype === "storage") return t.warehouseId === nodeHash;
        if (areatype === "delivery") return t.warehouseId === nodeHash;
        return true;
    });
    const putaways = (projection?.putawayTasks ?? []).filter((t) => {
        if (!nodeHash) return true;
        if (areatype === "storage") return t.warehouseId === nodeHash;
        if (areatype === "reception") return t.sourceLocationId?.startsWith(nodeHash) ?? false;
        return true;
    });
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
                        buildAllocationsStory(alloc, "sales_order", effectiveNow),
                        ...(FULL_TIMELINE ? [buildPickTasksStory(picks, effectiveNow)] : []),
                    ];
                case "reception":
                    return [
                        buildPurchaseOrdersStory(purchaseOrders, effectiveNow),
                        buildReceiptsStory(rcp, effectiveNow),
                        ...(FULL_TIMELINE ? [buildPutawayTasksStory(putaways, effectiveNow)] : []),
                    ];
                case "storage":
                    return [buildSalesOrdersStory(so), buildAllocationsStory(alloc, "production_order", effectiveNow)];
                case "quality":
                    return [
                        buildSalesOrdersStory(so),
                        ...(FULL_TIMELINE ? [buildPutawayTasksStory(putaways, effectiveNow)] : []),
                    ];
                default:
                    return [buildSalesOrdersStory(so)];
            }
        case "line":
        case "cell":
        case "machine":
            return [buildProductionOrdersStory(po), buildOperationsStory(ops)];
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
    highlightState,
    onEnter,
    onLeave,
}: {
    bar: BarItem;
    winStart: number;
    winEnd: number;
    laneIndex: number;
    barStyle: BarStyle;
    highlightState: HighlightState;
    onEnter: (content: React.ReactNode, e: ReactMouseEvent) => void;
    onLeave: () => void;
}) {
    //--------------------------------------------------------------------------
    // Store
    const { setHovered, setSelected } = useFocusStore();

    //--------------------------------------------------------------------------
    // Memos
    const style: CSSProperties | undefined = useMemo(() => {
        const left = toPct(bar.start, winStart, winEnd);
        const right = toPct(bar.end, winStart, winEnd);
        const clampedLeft = Math.max(0, left);
        const clampedRight = Math.min(100, right);
        const widthPct = Math.max(0.25, clampedRight - clampedLeft);
        const h = barStyle === "line" ? LINE_H : BAR_H;
        const rowHeight = barStyle === "bar" ? ROW_H : ROW_H_LINE;
        if (right < 0 || left > 100) {
            return;
        }

        return {
            left: `${clampedLeft}%`,
            width: `${widthPct}%`,
            top: laneIndex * rowHeight + (rowHeight - h) / 2,
            height: h,
        };
    }, [bar, barStyle, winStart, winEnd, laneIndex]);

    //--------------------------------------------------------------------------
    // Handlers
    const mouseEnterHandler = useCallback(
        (e: ReactMouseEvent) => {
            e.stopPropagation();
            onEnter(bar.tooltip, e);
            setHovered({ type: bar.entityType, id: bar.id });
        },
        [onEnter, bar, setHovered],
    );

    //--------------------------------------------------------------------------
    const mouseLeaveHandler = useCallback(
        (e: ReactMouseEvent) => {
            e.stopPropagation();
            onLeave();
            setHovered(null);
        },
        [onLeave, setHovered],
    );

    //--------------------------------------------------------------------------
    const mouseDownHandler = useCallback((e: ReactMouseEvent) => {
        e.stopPropagation();
    }, []);

    //--------------------------------------------------------------------------
    const mouseClickHandler = useCallback(
        (e: ReactMouseEvent) => {
            e.stopPropagation();
            setSelected({ type: bar.entityType, id: bar.id });
            const { factorySlug, nodeSlug } = Router.currentRoute();
            if (factorySlug) {
                Router.replace({ factorySlug, nodeSlug, itemSlug: bar.id });
            }
        },
        [bar, setSelected],
    );

    //--------------------------------------------------------------------------
    if (!style) return null;

    //--------------------------------------------------------------------------
    return (
        <div
            className={cn(
                "absolute cursor-pointer pointer-events-auto transition-[shadow,opacity]",
                barStyle === "line" ? "rounded-full" : "rounded-sm",
                highlightState === "dimmed" && "opacity-20",
                bar.className,
            )}
            style={style}
            onMouseEnter={mouseEnterHandler}
            onMouseLeave={mouseLeaveHandler}
            onMouseDown={mouseDownHandler}
            onClick={mouseClickHandler}
        />
    );
}

//------------------------------------------------------------------------------
// Main component
//------------------------------------------------------------------------------
export function Timeline() {
    const { selectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    const { hovered, setHovered, setSelected } = useFocusStore();
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
    const projection = useProjection(scope);
    const spanProjection = useSpanProjection();

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
    const correlated = useCorrelation(projection, activeFocus);

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

    const [tooltip, setTooltip] = useState<{ content: React.ReactNode; x: number; y: number } | null>(null);

    const trackRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    //--------------------------------------------------------------------------
    const zoomDef = timelineWindow.kind === "zoom" ? ZOOMS.find((z) => z.key === timelineWindow.key)! : null;
    const winStart = timelineWindow.kind === "zoom" ? present - zoomDef!.days * 86400 : timelineWindow.from;
    const winEnd = timelineWindow.kind === "zoom" ? present + (zoomDef!.days * 86400) / 2 : timelineWindow.to;
    const effectiveNow = asOf ?? present;

    //--------------------------------------------------------------------------
    const stories = useMemo(
        () => (level ? buildStories(level, projection, effectiveNow, areaType, selectedNode?.hash) : []),
        [level, projection, effectiveNow, areaType, selectedNode],
    );

    const downtimeBands = useMemo(() => {
        if (!spanProjection) return [];
        return spanProjection.downtimeEvents
            .map((dt) => ({
                dt,
                start: Math.max(dt.startedAt, winStart),
                end: Math.min(dt.endedAt ?? effectiveNow, winEnd),
            }))
            .filter(({ start, end }) => start < end);
    }, [spanProjection, winStart, winEnd, effectiveNow]);

    const workOrderBands = useMemo(() => {
        if (!spanProjection) return [];
        return spanProjection.eamWorkOrders
            .map((wo) => ({ wo, start: Math.max(wo.effectiveStart, winStart), end: Math.min(wo.effectiveEnd, winEnd) }))
            .filter(({ start, end }) => start < end);
    }, [spanProjection, winStart, winEnd]);

    const scopedDowntimeIds = useMemo(() => new Set(projection?.downtimeEvents.map((dt) => dt.id) ?? []), [projection]);
    const scopedWorkOrderIds = useMemo(() => new Set(projection?.eamWorkOrders.map((wo) => wo.id) ?? []), [projection]);
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
    // Tooltip
    const showTooltip = useCallback((content: React.ReactNode, e: ReactMouseEvent) => {
        if (!isDragging.current) setTooltip({ content, x: e.clientX, y: e.clientY });
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
            );
        }
    }, [tooltip]);

    //--------------------------------------------------------------------------
    return (
        <>
            <aside
                data-scenario="corrective-maintenance-step-6 predictive-maintenance-step-6"
                className={cn(
                    "flex flex-col pointer-events-auto border-b border-slate-200 select-none",
                    PERFORMANCE_MODE ? "bg-slate-0/97" : "bg-slate-0/80 backdrop-blur-xl",
                )}
            >
                {/* Body */}
                <div className="flex grow">
                    {/* Label column */}
                    <div
                        className="shrink-0 w-18 border-r border-slate-200/30 flex flex-col"
                        style={{ paddingTop: AXIS_H + ROW_GAP }}
                    >
                        {stories.map((story) => (
                            <div
                                key={story.id}
                                className="flex items-top px-2 shrink-0 justify-end"
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
                                {workOrderBands.map(({ wo, start, end }) => {
                                    const left = toPct(start, winStart, winEnd);
                                    const width = toPct(end, winStart, winEnd) - left;
                                    const tooltip = (
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
                                    );
                                    return (
                                        <div
                                            key={wo.id}
                                            className={cn(
                                                "absolute top-0 bottom-0 cursor-pointer",
                                                scopedWorkOrderIds.has(wo.id) ? "bg-amber-200" : "bg-amber-200",
                                            )}
                                            style={{ left: `${left}%`, width: `${width}%`, minWidth: "2px" }}
                                            onMouseEnter={(e) => {
                                                showTooltip(tooltip, e);
                                                setHovered({ type: "workOrder", id: wo.id });
                                            }}
                                            onMouseLeave={() => {
                                                hideTooltip();
                                                setHovered(null);
                                            }}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelected({ type: "workOrder", id: wo.id });
                                                const { factorySlug, nodeSlug } = Router.currentRoute();
                                                if (factorySlug) {
                                                    Router.replace({ factorySlug, nodeSlug, itemSlug: wo.id });
                                                }
                                            }}
                                        />
                                    );
                                })}
                            </div>

                            {/* Downtime bands */}
                            {downtimeBands.map(({ dt, start, end }) => {
                                const left = toPct(start, winStart, winEnd);
                                const width = toPct(end, winStart, winEnd) - left;
                                const tooltip = (
                                    <div className="space-y-1.5">
                                        <div className="font-semibold text-red-300">
                                            {dt.reasonCode}
                                            {dt.isOngoing && (
                                                <span className="ml-1.5 text-[10px] text-red-400/80">ongoing</span>
                                            )}
                                        </div>
                                        {dt.reasonDescription && (
                                            <div className="text-slate-400 text-[11px]">{dt.reasonDescription}</div>
                                        )}
                                        <div>
                                            <span className="text-slate-500">Start </span>
                                            {fmtTs(dt.startedAt)}
                                        </div>
                                        <div>
                                            <span className="text-slate-500">Duration </span>
                                            {fmtDuration(dt.durationAtAsOf)}
                                        </div>
                                    </div>
                                );
                                return (
                                    <div
                                        key={dt.id}
                                        className={cn(
                                            "absolute top-0 bottom-0 cursor-pointer",
                                            scopedDowntimeIds.has(dt.id) ? "bg-red-300" : "bg-red-600",
                                        )}
                                        style={{ left: `${left}%`, width: `${width}%`, minWidth: "2px" }}
                                        onMouseEnter={(e) => {
                                            showTooltip(tooltip, e);
                                            setHovered({ type: "downtime", id: dt.id });
                                        }}
                                        onMouseLeave={() => {
                                            hideTooltip();
                                            setHovered(null);
                                        }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelected({ type: "downtime", id: dt.id });
                                            const { factorySlug, nodeSlug } = Router.currentRoute();
                                            if (factorySlug) {
                                                Router.replace({ factorySlug, nodeSlug, itemSlug: dt.id });
                                            }
                                        }}
                                    />
                                );
                            })}
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
                <div className="flex items-center pr-3 h-8 border-b border-slate-200/10">
                    <div className="w-18 px-2 border-r border-slate-200/30">
                        <FooterTabs />
                    </div>
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
                    <div className="flex-grow" />
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
                </div>
            </aside>
            <CorrelationModal />
            {tooltipContent}
        </>
    );
}
