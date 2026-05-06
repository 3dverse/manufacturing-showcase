//------------------------------------------------------------------------------
import { useMemo, useRef, useContext, useCallback } from "react";

//------------------------------------------------------------------------------
import Tooltip from "@/components/common/Tooltip/Tooltip";
import { ManufacturingOrderProgressBar } from "@/components/manufacturingOrders/ManufacturingOrderProgressBar";

//------------------------------------------------------------------------------
import { useTimelineStore } from "@/store/useTimelineStore";
import { useNavigationStore } from "@/store/useNavigationStore";
import { useFactoryStore } from "@/store/useFactoryStore";
import { FactoriesContext } from "@/contexts/FactoriesContext";
import { buildClosedIntervals } from "@/core/Calendar";

//------------------------------------------------------------------------------
import type { Order } from "@/content/type";
import type { HomeDowntimeEvent } from "@/hooks/useHomePageData";
import type { ProjectedWorkOrder } from "@/core/Projection";

/** Half-width of the visible window on each side of ref (ref = horizontal center). */
const TIMELINE_HALF_WINDOW_MS = 5 * 24 * 60 * 60 * 1000;

//------------------------------------------------------------------------------
type TimelineEventColumn = {
    id: string;
    type: "stop" | "maintenance";
    machine: string;
    details: string;
    startMs: number;
    endMs: number;
    leftPct: number;
    widthPct: number;
};

//------------------------------------------------------------------------------
export const ManufacturingOrderTimeline = ({
    orders,
    downtimeEvents,
    eamWorkOrders,
    isLoading,
    refTs,
}: {
    orders: Order[];
    downtimeEvents: HomeDowntimeEvent[];
    eamWorkOrders: ProjectedWorkOrder[];
    isLoading: boolean;
    refTs: number; // Unix seconds — center of the display window (asOf ?? present)
}) => {
    //--------------------------------------------------------------------------
    const refMs = useMemo(() => refTs * 1000, [refTs]);
    const minTime = useMemo(() => refMs - TIMELINE_HALF_WINDOW_MS, [refMs]);
    const maxTime = useMemo(() => refMs + TIMELINE_HALF_WINDOW_MS, [refMs]);
    const totalSpan = useMemo(() => maxTime - minTime, [maxTime, minTime]);

    // Helper: ms → % within the window
    const toPct = useCallback((ms: number) => ((ms - minTime) / totalSpan) * 100, [minTime, totalSpan]);
    //--------------------------------------------------------------------------
    const sorted = useMemo(
        () =>
            [...orders]
                .filter((o) => o.endDate.getTime() >= minTime && o.startDate.getTime() <= maxTime)
                .sort((a, b) => a.startDate.getTime() - b.startDate.getTime()),
        [orders, minTime, maxTime],
    );

    const clientGroups = useMemo(() => {
        const groups = new Map<string, Order[]>();
        for (const order of sorted) {
            if (!groups.has(order.client)) groups.set(order.client, []);
            groups.get(order.client)!.push(order);
        }
        return groups;
    }, [sorted]);

    const nowPct = useMemo(
        () => (totalSpan > 0 ? ((refMs - minTime) / totalSpan) * 100 : 50),
        [refMs, minTime, totalSpan],
    );

    const rowsRef = useRef<HTMLDivElement>(null);
    const setAsOf = useTimelineStore((state) => state.setAsOf);
    const navigate = useNavigationStore((state) => state.navigate);
    const currentFactory = useFactoryStore((state) => state.currentFactory);
    const { factories } = useContext(FactoriesContext);

    //--------------------------------------------------------------------------
    // Closed intervals (nights + weekends)
    const closedIntervals = useMemo(() => buildClosedIntervals(minTime / 1000, maxTime / 1000), [minTime, maxTime]);

    //--------------------------------------------------------------------------
    const timelineEventColumns = useMemo(() => {
        return downtimeEvents
            .map((event) => {
                const clippedStartMs = Math.max(event.startMs, minTime);
                const clippedEndMs = Math.min(event.endMs, maxTime);
                if (clippedEndMs <= clippedStartMs) return null;

                return {
                    id: event.id,
                    type: event.type,
                    machine: event.label,
                    details: event.details,
                    startMs: event.startMs,
                    endMs: event.endMs,
                    leftPct: toPct(clippedStartMs),
                    widthPct: Math.max(((clippedEndMs - clippedStartMs) / totalSpan) * 100, 0.5),
                } satisfies TimelineEventColumn;
            })
            .filter((event): event is TimelineEventColumn => event !== null)
            .sort((a, b) => a.startMs - b.startMs);
    }, [downtimeEvents, minTime, maxTime, totalSpan, toPct]);

    //--------------------------------------------------------------------------
    const workOrderColumns = useMemo(
        () =>
            eamWorkOrders
                .map((wo) => {
                    const startMs = (wo.actualStart ?? wo.scheduledStart) * 1000;
                    const endMs = (wo.actualEnd ?? wo.scheduledEnd) * 1000;
                    const clippedStart = Math.max(startMs, minTime);
                    const clippedEnd = Math.min(endMs, maxTime);
                    if (clippedEnd <= clippedStart) return null;
                    return {
                        wo,
                        leftPct: toPct(clippedStart),
                        widthPct: Math.max(((clippedEnd - clippedStart) / totalSpan) * 100, 0.5),
                    };
                })
                .filter((x): x is NonNullable<typeof x> => x !== null),
        [eamWorkOrders, minTime, maxTime, totalSpan, toPct],
    );

    //--------------------------------------------------------------------------
    const timeLabels = useMemo(() => {
        const labels: { label: string; pct: number }[] = [];
        const start = new Date(minTime);
        start.setMinutes(0, 0, 0);
        const step = totalSpan <= 24 * 3600 * 1000 ? 2 * 3600 * 1000 : 24 * 3600 * 1000;
        let t = start.getTime();
        while (t <= maxTime) {
            labels.push({
                label:
                    step < 24 * 3600 * 1000
                        ? new Date(t).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
                        : new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
                pct: toPct(t),
            });
            t += step;
        }
        return labels;
    }, [minTime, maxTime, totalSpan, toPct]);

    const firstEnabledFactory = useMemo(
        () => factories.find((factory) => factory.enabled) || factories[0],
        [factories],
    );

    //--------------------------------------------------------------------------
    const openOrderAtStart = (order: Order) => {
        setAsOf(Math.floor(order.startDate.getTime() / 1000));

        const targetFactory = currentFactory ?? firstEnabledFactory;
        if (!targetFactory) return;

        const targetRoute = `/${targetFactory.slug}`;
        if (window.location.pathname !== targetRoute) {
            navigate(targetRoute);
        }
    };

    //--------------------------------------------------------------------------
    if (isLoading || sorted.length === 0) {
        return (
            <div className="flex items-center justify-center h-16 text-xs text-muted">
                {isLoading ? "Loading orders..." : "No orders in this period"}
            </div>
        );
    }

    //--------------------------------------------------------------------------
    return (
        <div className="flex flex-col gap-0.5 overflow-x-auto">
            {/* Time axis */}
            <div className="relative h-4 mr-1">
                {timeLabels.map(({ label, pct }) => (
                    <span
                        key={label}
                        className="absolute top-0 text-2xs text-muted whitespace-nowrap"
                        style={{ left: `${pct}%` }}
                    >
                        {label}
                    </span>
                ))}
                <span
                    className="absolute left-0 -bottom-5 px-1 text-2xs text-accent -translate-x-1/2 tracking-wide whitespace-nowrap bg-slate-0 rounded-md z-10"
                    style={{ left: `${nowPct}%` }}
                >
                    {new Date(refMs).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                </span>
            </div>

            {/* Rows */}
            <div
                ref={rowsRef}
                className="relative flex flex-col divide-y divide-muted border border-muted rounded bg-neutral-0/50 overflow-hidden"
            >
                {/* Schedule bands — nights + weekends */}
                {closedIntervals.map(({ start, end }) => (
                    <div
                        key={start}
                        className="absolute top-0 bottom-0 bg-underground/60 pointer-events-none z-0"
                        style={{
                            left: `${toPct(start * 1000)}%`,
                            width: `${((end - start) / (totalSpan / 1000)) * 100}%`,
                        }}
                    />
                ))}

                {/* Work order bands */}
                {workOrderColumns.map(({ wo, leftPct, widthPct }) => (
                    <div
                        key={wo.id}
                        className="absolute top-0 bottom-0 z-1 pointer-events-auto"
                        style={{ left: `${leftPct}%`, width: `${widthPct}%`, minWidth: "3px" }}
                    >
                        <Tooltip
                            content={
                                <div className="flex flex-col gap-1 px-1.5 py-1">
                                    <p className="text-sm font-medium">
                                        Maintenance{" "}
                                        <span className="font-normal text-muted capitalize text-xs">
                                            {wo.workType.replace("_", " ")}
                                        </span>
                                    </p>
                                    <p className="text-sm text-muted">{wo.workOrderNumber}</p>
                                    {wo.projected.isOverdue && <p className="text-xs text-warning">Overdue</p>}
                                    <p className="text-xs text-muted">
                                        {new Date((wo.actualStart ?? wo.scheduledStart) * 1000).toLocaleString(
                                            undefined,
                                            {
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            },
                                        )}{" "}
                                        →{" "}
                                        {new Date((wo.actualEnd ?? wo.scheduledEnd) * 1000).toLocaleString(undefined, {
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                            }
                            showArrow={true}
                            offset={4}
                            containerClassName="block h-full w-full"
                        >
                            <div className="h-full w-full bg-warning/20 hover:bg-warning/35 transition-colors duration-150" />
                        </Tooltip>
                    </div>
                ))}

                {/* Now marker */}
                <div
                    className="absolute top-0 bottom-0 w-px bg-accent/70 z-0 pointer-events-none"
                    style={{ left: `${nowPct}%` }}
                />

                {/* Downtime bands */}
                {timelineEventColumns.map((eventColumn) => (
                    <TimelineEventOverlay key={eventColumn.id} eventColumn={eventColumn} />
                ))}

                {/* Order rows */}
                {[...clientGroups.entries()].map(([client, clientOrders]) => (
                    <div key={client} className="relative z-1 pointer-events-none">
                        <div className="px-2 py-0.5 text-2xs font-medium text-muted bg-underground/80 backdrop-blur-xl relative z-1 pointer-events-auto">
                            {client}
                        </div>
                        {clientOrders.map((order) => {
                            const leftPct = toPct(order.startDate.getTime());
                            const rightPct = toPct(order.endDate.getTime());
                            const clampedLeft = Math.max(0, leftPct);
                            const clampedRight = Math.min(100, rightPct);
                            if (rightPct < 0 || leftPct > 100) return null;
                            const clampedWidth = Math.max(clampedRight - clampedLeft, 0.5);

                            return (
                                <div
                                    key={order.ref}
                                    className="flex items-center gap-2 px-1 py-px hover:bg-underground/30 transition-colors duration-150 group pointer-events-none"
                                >
                                    <div className="relative flex-1 h-5">
                                        <ManufacturingOrderTimelineNode
                                            order={order}
                                            style={{
                                                left: `${clampedLeft}%`,
                                                width: `${clampedWidth}%`,
                                            }}
                                            className="absolute top-0 h-full pointer-events-auto"
                                            onClick={() => openOrderAtStart(order)}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

//------------------------------------------------------------------------------
type TimelineEventOverlayProps = {
    eventColumn: TimelineEventColumn;
};

//------------------------------------------------------------------------------
const TimelineEventOverlay = ({ eventColumn }: TimelineEventOverlayProps) => {
    const colorClass =
        eventColumn.type === "stop" ? "bg-negative/25 hover:bg-negative/45" : "bg-warning/25 hover:bg-warning/45";

    const formattedStart = new Date(eventColumn.startMs).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
    const formattedEnd = new Date(eventColumn.endMs).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
    const durationMinutes = Math.max(Math.round((eventColumn.endMs - eventColumn.startMs) / 60000), 1);
    const durationText =
        durationMinutes >= 60 ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m` : `${durationMinutes}m`;
    const eventTypeText = eventColumn.type === "stop" ? "Machine stop" : "Maintenance";

    return (
        <div
            className="absolute top-0 bottom-0 z-1"
            style={{
                left: `${eventColumn.leftPct}%`,
                width: `${eventColumn.widthPct}%`,
                minWidth: "4px",
            }}
        >
            <Tooltip
                content={
                    <div className="flex flex-col gap-1 px-1.5 py-1">
                        <p className="text-sm font-medium">
                            {eventTypeText}{" "}
                            <span className="font-normal text-muted text-xs">{eventColumn.machine}</span>
                        </p>
                        <p className="text-sm text-muted">{eventColumn.details}</p>
                        <p className="text-xs text-muted">
                            {formattedStart} → {formattedEnd} ({durationText})
                        </p>
                    </div>
                }
                showArrow={true}
                offset={4}
                containerClassName="block h-full w-full"
            >
                <div className={`h-full w-full transition-colors duration-150 ${colorClass}`} />
            </Tooltip>
        </div>
    );
};

//------------------------------------------------------------------------------
type ManufacturingOrderTimelineNodeProps = {
    order: Order;
    style: React.CSSProperties;
    onClick: () => void;
    className: string;
};

//------------------------------------------------------------------------------
const ManufacturingOrderTimelineNode = ({ order, style, onClick, className }: ManufacturingOrderTimelineNodeProps) => {
    return (
        <div className={className} style={style}>
            <Tooltip
                content={
                    <div className="flex flex-col gap-0.5 text-2xs">
                        <p className="font-medium">{order.ref}</p>
                        <p className="text-muted">{order.client}</p>
                        <p>
                            {order.startDate.toLocaleTimeString(undefined, {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}{" "}
                            →{" "}
                            {order.endDate.toLocaleTimeString(undefined, {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </p>
                        <p>
                            {order.unitsCompleted}/{order.unitsPlanned} units shipped
                        </p>
                    </div>
                }
                showArrow={false}
                offset={4}
                containerClassName="block h-full w-full"
            >
                <ManufacturingOrderProgressBar order={order} solid className="h-full w-full" onClick={onClick} />
            </Tooltip>
        </div>
    );
};
