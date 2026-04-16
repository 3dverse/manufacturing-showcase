//------------------------------------------------------------------------------
import { useMemo, useEffect, useRef, useState } from "react";

//------------------------------------------------------------------------------
import Tooltip from "@/components/common/Tooltip/Tooltip";
import { Icon } from "@/components/common/Icon";
import { faCheck } from "@fortawesome/sharp-solid-svg-icons";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import { orders, orderStatus } from "@/content/orders";

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

                            return (
                                <Tooltip
                                    key={order.ref}
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
                                    containerClassName="block w-full"
                                >
                                    <div className="flex items-center gap-1 px-1 py-px hover:bg-underground transition-colors duration-150 cursor-pointer group">
                                        {/* <span
                                            className={cn(
                                                "w-24 shrink-0 text-2xs tabular-nums truncate",
                                                order.status.name === orderStatus.inProgress.name
                                                    ? "text-accent font-medium"
                                                    : "text-subtle",
                                            )}
                                        >
                                            {order.ref}
                                        </span> */}
                                        <div className="relative flex-1 h-5">
                                            <div
                                                className={cn(
                                                    "absolute top-0 flex items-center justify-between h-full rounded-sm overflow-hidden",
                                                    barColor,
                                                    order.status.name === orderStatus.planned.name
                                                        ? "opacity-50 group-hover:opacity-80"
                                                        : "",
                                                )}
                                                style={{
                                                    left: `${leftPct}%`,
                                                    width: `${Math.max(widthPct, 2)}%`,
                                                }}
                                            >
                                                {progress > 0 && (
                                                    <div
                                                        className={cn("absolute top-0 h-full", progressColor)}
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                )}
                                                <span className="relative z-1 text-2xs font-medium px-1 pointer-events-none whitespace-nowrap">
                                                    {order.ref}
                                                </span>
                                                <span
                                                    className="text-2xs opacity-80 font-medium px-1 pointer-events-none"
                                                    style={{ left: `${leftPct}%` }}
                                                >
                                                    {progress === 100 ? (
                                                        <Icon icon={faCheck} className="text-2xs" />
                                                    ) : progress > 0 ? (
                                                        `${progress}%`
                                                    ) : (
                                                        ""
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Tooltip>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};
