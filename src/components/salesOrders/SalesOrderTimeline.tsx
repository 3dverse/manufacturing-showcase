//------------------------------------------------------------------------------
import { useMemo, useEffect, useRef, useState, useContext } from "react";

//------------------------------------------------------------------------------
import Tooltip from "@/components/common/Tooltip/Tooltip";
import { SalesOrderProgressBar } from "./SalesOrderProgressBar";

//------------------------------------------------------------------------------
import { useTimelineStore } from "@/store/useTimelineStore";
import { useNavigationStore } from "@/store/useNavigationStore";
import { useFactoryStore } from "@/store/useFactoryStore";
import { FactoriesContext } from "@/contexts/FactoriesContext";

//------------------------------------------------------------------------------
import { orders } from "@/content/orders";
import { machineTimelineEvents } from "@/content/events";

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
export const SalesOrderTimeline = () => {
    //--------------------------------------------------------------------------
    const sorted = useMemo(() => [...orders].sort((a, b) => a.startDate.getTime() - b.startDate.getTime()), []);

    //--------------------------------------------------------------------------
    const minTime = useMemo(() => Math.min(...sorted.map((o) => o.startDate.getTime())), [sorted]);
    const maxTime = useMemo(() => Math.max(...sorted.map((o) => o.endDate.getTime())), [sorted]);
    const totalSpan = maxTime - minTime || 1;

    const clientGroups = useMemo(() => {
        const groups = new Map<string, typeof orders>();
        for (const order of sorted) {
            if (!groups.has(order.client)) groups.set(order.client, []);
            groups.get(order.client)!.push(order);
        }
        return groups;
    }, [sorted]);

    const [now, setNow] = useState(() => Date.now());

    //--------------------------------------------------------------------------
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 60_000);
        return () => clearInterval(id);
    }, []);

    const nowPct = ((now - minTime) / totalSpan) * 100;
    const isNowInRange = nowPct >= 0 && nowPct <= 100;

    const rowsRef = useRef<HTMLDivElement>(null);
    const setAsOf = useTimelineStore((state) => state.setAsOf);
    const navigate = useNavigationStore((state) => state.navigate);
    const currentFactory = useFactoryStore((state) => state.currentFactory);
    const { factories } = useContext(FactoriesContext);

    //--------------------------------------------------------------------------
    const timelineEventColumns = useMemo(() => {
        return machineTimelineEvents
            .map((event) => {
                const startMs = event.date.getTime();
                const endMs = startMs + event.durationHours * 60 * 60 * 1000;
                const clippedStartMs = Math.max(startMs, minTime);
                const clippedEndMs = Math.min(endMs, maxTime);
                if (clippedEndMs <= clippedStartMs) return null;

                return {
                    id: event.id,
                    type: event.type,
                    machine: event.machine,
                    details: event.details,
                    startMs,
                    endMs,
                    leftPct: ((clippedStartMs - minTime) / totalSpan) * 100,
                    widthPct: Math.max(((clippedEndMs - clippedStartMs) / totalSpan) * 100, 0.5),
                } satisfies TimelineEventColumn;
            })
            .filter((event): event is TimelineEventColumn => event !== null)
            .sort((a, b) => a.startMs - b.startMs);
    }, [minTime, maxTime, totalSpan]);

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
                pct: ((t - minTime) / totalSpan) * 100,
            });
            t += step;
        }
        return labels;
    }, [minTime, maxTime, totalSpan]);

    const firstEnabledFactory = useMemo(
        () => factories.find((factory) => factory.enabled) || factories[0],
        [factories],
    );

    //--------------------------------------------------------------------------
    const openOrderAtStart = (order: (typeof orders)[number]) => {
        setAsOf(Math.floor(order.startDate.getTime() / 1000));

        const targetFactory = currentFactory ?? firstEnabledFactory;
        if (!targetFactory) return;

        const targetRoute = `/${targetFactory.slug}`;
        if (window.location.pathname !== targetRoute) {
            navigate(targetRoute);
        }
    };

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
                {isNowInRange && (
                    <span
                        className="absolute left-0 -bottom-5 px-1 text-2xs text-accent -translate-x-1/2 tracking-wide whitespace-nowrap bg-slate-0 rounded-md z-10"
                        style={{ left: `${nowPct}%` }}
                    >
                        {new Date(now).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </span>
                )}
            </div>

            {/* Rows */}
            <div
                ref={rowsRef}
                className="relative flex flex-col divide-y divide-muted border border-muted rounded bg-neutral-0/50"
            >
                {isNowInRange && (
                    <div
                        className="absolute top-0 bottom-0 w-px bg-accent/70 z-0 pointer-events-none"
                        style={{ left: `${nowPct}%` }}
                    />
                )}
                {timelineEventColumns.map((eventColumn) => (
                    <TimelineEventOverlay key={eventColumn.id} eventColumn={eventColumn} />
                ))}
                {[...clientGroups.entries()].map(([client, clientOrders]) => (
                    <div key={client}>
                        <div className="px-2 py-0.5 text-2xs font-medium text-muted bg-underground/80 backdrop-blur-xl relative z-1">
                            {client}
                        </div>
                        {clientOrders.map((order) => {
                            const leftPct = ((order.startDate.getTime() - minTime) / totalSpan) * 100;
                            const widthPct = ((order.endDate.getTime() - order.startDate.getTime()) / totalSpan) * 100;

                            return (
                                <div
                                    key={order.ref}
                                    className="flex items-center gap-2 px-1 py-px hover:bg-underground/30 transition-colors duration-150 group pointer-events-none"
                                >
                                    <div className="relative flex-1 h-5">
                                        <SalesOrderTimelineNode
                                            order={order}
                                            style={{
                                                left: `${leftPct}%`,
                                                width: `${Math.max(widthPct, 2)}%`,
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
            className="absolute top-0 bottom-0 z-0"
            style={{
                left: `${eventColumn.leftPct}%`,
                width: `${eventColumn.widthPct}%`,
                minWidth: "4px",
            }}
        >
            <Tooltip
                content={
                    <div className="flex flex-col gap-1 px-1.5 py-1">
                        <p className="text-xs text-muted">{eventTypeText}</p>
                        <p className="text-sm font-medium">{eventColumn.machine}</p>
                        <p className="text-sm ">{eventColumn.details}</p>
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
type SalesOrderTimelineNodeProps = {
    order: (typeof orders)[number];
    style: React.CSSProperties;
    onClick: () => void;
    className: string;
};

//------------------------------------------------------------------------------
const SalesOrderTimelineNode = ({ order, style, onClick, className }: SalesOrderTimelineNodeProps) => {
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
                <SalesOrderProgressBar order={order} className="h-full w-full" onClick={onClick} />
            </Tooltip>
        </div>
    );
};
