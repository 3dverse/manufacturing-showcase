//------------------------------------------------------------------------------
import { useMemo, useEffect, useRef, useState, useContext } from "react";

//------------------------------------------------------------------------------
import Tooltip from "@/components/common/Tooltip/Tooltip";
import { Icon } from "@/components/common/Icon";
import { faAngleRight, faCheck } from "@fortawesome/sharp-solid-svg-icons";
import Button from "@/components/common/Button";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import { orders, orderStatus } from "@/content/orders";
import { useTimelineStore } from "@/store/useTimelineStore";
import { useNavigationStore } from "@/store/useNavigationStore";
import { useFactoryStore } from "@/store/useFactoryStore";
import { FactoriesContext } from "@/contexts/FactoriesContext";
import { UseCaseContext } from "@/contexts/UseCaseContext";

//------------------------------------------------------------------------------
export const SalesOrderTimeline = () => {
    const sorted = useMemo(() => [...orders].sort((a, b) => a.startDate.getTime() - b.startDate.getTime()), []);

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
    const { useCases, activeUseCaseId, useCaseActivatedAt, requestIncidentFocus } = useContext(UseCaseContext);
    const activeUseCase = activeUseCaseId ? useCases[activeUseCaseId] : undefined;
    const incidentConfig = activeUseCase?.salesOrderIncident;

    const incidentStartMs = useCaseActivatedAt ?? null;
    const incidentStartPct = incidentStartMs !== null ? ((incidentStartMs - minTime) / totalSpan) * 100 : null;
    const showIncidentMarker =
        activeUseCaseId && incidentStartPct !== null && incidentStartPct >= 0 && incidentStartPct <= 100;

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

    const openOrderAtStart = (order: (typeof orders)[number]) => {
        setAsOf(Math.floor(order.startDate.getTime() / 1000));

        const targetFactory = currentFactory ?? firstEnabledFactory;
        if (!targetFactory) return;

        const targetRoute = `/${targetFactory.slug}`;
        if (window.location.pathname !== targetRoute) {
            navigate(targetRoute);
        }
    };

    const openActiveIncident = () => {
        if (!activeUseCaseId || !incidentConfig) return;

        requestIncidentFocus(activeUseCaseId);
        setAsOf(Math.floor(new Date(incidentConfig.startDateIso).getTime() / 1000));

        const targetFactory = currentFactory ?? firstEnabledFactory;
        if (!targetFactory) return;

        const targetRoute = `/${targetFactory.slug}`;
        if (window.location.pathname !== targetRoute) {
            navigate(targetRoute);
        }
    };

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
                {showIncidentMarker && incidentStartMs !== null && (
                    <span
                        className="absolute -bottom-5 px-1 text-2xs text-warning-700 -translate-x-1/2 whitespace-nowrap bg-slate-0 rounded-md z-10"
                        style={{ left: `${incidentStartPct}%` }}
                    >
                        {new Date(incidentStartMs).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
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
                {showIncidentMarker && (
                    <div
                        className="absolute top-0 bottom-0 w-px bg-warning-500 z-0 pointer-events-none"
                        style={{ left: `${incidentStartPct}%` }}
                    />
                )}
                {[...clientGroups.entries()].map(([client, clientOrders]) => (
                    <div key={client}>
                        <div className="px-2 py-0.5 text-2xs font-medium text-muted bg-underground/60">{client}</div>
                        {clientOrders.map((order) => {
                            const leftPct = ((order.startDate.getTime() - minTime) / totalSpan) * 100;
                            const widthPct = ((order.endDate.getTime() - order.startDate.getTime()) / totalSpan) * 100;
                            const progress =
                                order.unitsPlanned > 0
                                    ? Math.round((order.unitsCompleted / order.unitsPlanned) * 100)
                                    : 0;

                            const barColor =
                                order.status.name === orderStatus.completed.name
                                    ? "bg-positive-500/70 text-positive-50"
                                    : order.status.name === orderStatus.inProgress.name
                                      ? "bg-accent-500/70 text-accent-50"
                                      : order.status.name === orderStatus.cancelled.name
                                        ? "bg-negative-500/50 text-negative-800"
                                        : "bg-neutral-400/40 text-neutral-900";

                            const progressColor =
                                order.status.name === orderStatus.completed.name
                                    ? "bg-positive-500/70"
                                    : order.status.name === orderStatus.inProgress.name
                                      ? "bg-accent-600 stripes [--color:var(--color-accent-400)]"
                                      : "bg-neutral-500";

                            const isIncidentOrder = Boolean(
                                incidentConfig &&
                                activeUseCaseId &&
                                order.ref === incidentConfig.orderRef &&
                                order.status.name === orderStatus.inProgress.name,
                            );
                            const incidentLeftPct = (((useCaseActivatedAt ?? 0) - minTime) / totalSpan) * 100;
                            const incidentWidthPct =
                                ((Math.min(now, maxTime) - (useCaseActivatedAt ?? 0)) / totalSpan) * 100;
                            const hasIncidentBar = isIncidentOrder && incidentWidthPct > 0;
                            const stopAction = incidentConfig?.actions.find((action) => action.role === "stopMachine");
                            const goToAction = incidentConfig?.actions.find((action) => action.role === "goToIncident");

                            return (
                                <div
                                    key={order.ref}
                                    className="flex items-center gap-2 px-1 py-px hover:bg-underground/30 transition-colors duration-150 group"
                                >
                                    <div className="relative flex-1 h-5">
                                        {hasIncidentBar && (
                                            <div
                                                className="absolute top-0 h-full rounded-sm bg-warning-500/70 stripes [--color:var(--color-warning-300)] pointer-events-none z-2"
                                                style={{
                                                    left: `${Math.max(incidentLeftPct, 0)}%`,
                                                    width: `${Math.min(incidentWidthPct, 100)}%`,
                                                    minWidth: "5px",
                                                }}
                                            />
                                        )}
                                        <SalesOrderTimelineNode
                                            order={order}
                                            style={{
                                                left: `${leftPct}%`,
                                                width: `${Math.max(widthPct, 2)}%`,
                                            }}
                                            progress={progress}
                                            progressColor={progressColor}
                                            className={barColor}
                                            onClick={() => openOrderAtStart(order)}
                                        />
                                    </div>
                                    {isIncidentOrder && incidentConfig && (
                                        <div className="relative z-10 w-72 shrink-0 rounded-md border border-warning-400/70 bg-slate-0/95 px-3 py-2 shadow-lg starting:opacity-0 starting:translate-y-2 opacity-100 translate-y-0 transition-all duration-400">
                                            <p className="text-xs font-semibold text-muted">{incidentConfig.title}</p>
                                            <p className="mt-1 text-xs text-warning-700">
                                                {incidentConfig.warningMessage}
                                            </p>
                                            <div className="mt-2 flex items-center justify-between gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="xs"
                                                    disabled={Boolean(stopAction?.disabled)}
                                                    className="border border-warning-300/60 text-warning-700 pointer-events-none"
                                                >
                                                    {stopAction?.label}
                                                </Button>
                                                <Button
                                                    variant="guidance"
                                                    className="text-warning-50 bg-warning-700 hover:bg-warning-600"
                                                    size="xs"
                                                    onClick={openActiveIncident}
                                                >
                                                    <Icon icon={faAngleRight} size="xs" className="mr-1" />
                                                    {goToAction?.label}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
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
type SalesOrderTimelineNodeProps = {
    order: (typeof orders)[number];
    style: React.CSSProperties;
    onClick: () => void;
    progress: number;
    className: string;
    progressColor: string;
};

const SalesOrderTimelineNode = ({
    order,
    style,
    onClick,
    progress,
    className,
    progressColor,
}: SalesOrderTimelineNodeProps) => {
    return (
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
        >
            <div
                className={cn(
                    "absolute top-0 flex items-center justify-between h-full rounded-sm overflow-hidden cursor-pointer",
                    className,
                    order.status.name === orderStatus.planned.name ? "opacity-50 group-hover:opacity-80" : "",
                )}
                style={style}
                onClick={onClick}
            >
                {progress > 0 && (
                    <div className={cn("absolute top-0 h-full", progressColor)} style={{ width: `${progress}%` }} />
                )}
                <span className="relative z-1 text-2xs font-medium px-1 pointer-events-none whitespace-nowrap">
                    {order.ref}
                </span>
                <span className="text-2xs opacity-80 font-medium px-1 pointer-events-none">
                    {progress === 100 ? (
                        <Icon icon={faCheck} className="text-2xs" />
                    ) : progress > 0 ? (
                        `${progress}%`
                    ) : (
                        ""
                    )}
                </span>
            </div>
        </Tooltip>
    );
};
