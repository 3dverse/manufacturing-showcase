//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";
import { faCheck } from "@fortawesome/sharp-solid-svg-icons";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";
import { formatDuration } from "@/utils/helpers-time";

//------------------------------------------------------------------------------
import { orderStatus } from "@/content/orders";
import type { Order } from "@/content/type";

//------------------------------------------------------------------------------
type ManufacturingOrderProgressBarProps = {
    order: Order;
    size?: "md" | "lg";
    solid?: boolean;
    showClientName?: boolean;
    showDuration?: boolean;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
};

//------------------------------------------------------------------------------
export const ManufacturingOrderProgressBar = ({
    order,
    size = "md",
    solid = false,
    showClientName = false,
    showDuration = false,
    className,
    style,
    onClick,
}: ManufacturingOrderProgressBarProps) => {
    const progress_prct = order.unitsPlanned > 0 ? Math.round((order.unitsCompleted / order.unitsPlanned) * 100) : 0;

    //--------------------------------------------------------------------------
    const barColor = solid
        ? order.status.name === orderStatus.completed.name
            ? "bg-positive-500 text-positive-50"
            : order.status.name === orderStatus.inProgress.name
              ? "bg-accent-500 text-accent-50"
              : order.status.name === orderStatus.cancelled.name
                ? "bg-negative-500 text-negative-800"
                : "bg-neutral-400 text-neutral-900"
        : order.status.name === orderStatus.completed.name
          ? "bg-positive-500/70 text-positive-50"
          : order.status.name === orderStatus.inProgress.name
            ? "bg-accent-500/60 text-accent-50"
            : order.status.name === orderStatus.cancelled.name
              ? "bg-negative-500/50 text-negative-800"
              : "bg-neutral-400/40 text-neutral-900";

    const progressColor =
        order.status.name === orderStatus.completed.name
            ? solid
                ? "bg-positive-700"
                : "bg-positive-700/70"
            : order.status.name === orderStatus.inProgress.name
              ? "bg-accent-600 stripes [--color:var(--color-accent-900)]"
              : "bg-neutral-500";

    const nowTs = Date.now();
    const plannedDurationMin = Math.max(0, Math.round((order.endDate.getTime() - order.startDate.getTime()) / 60000));
    const effectiveDurationMin = plannedDurationMin;
    const currentDurationMin = Math.max(0, Math.round((nowTs - order.startDate.getTime()) / 60000));
    const durationMin =
        order.status.name === orderStatus.planned.name
            ? plannedDurationMin
            : order.status.name === orderStatus.completed.name
              ? effectiveDurationMin
              : order.status.name === orderStatus.inProgress.name
                ? currentDurationMin
                : currentDurationMin;
    const durationLabel = formatDuration(durationMin);

    //--------------------------------------------------------------------------
    return (
        <div
            className={cn(
                "relative flex items-center text-slate-0 rounded-sm overflow-hidden backdrop-blur-lg",
                barColor,
                size === "lg" ? "text-sm pl-3 pr-2 py-1.5" : "text-2xs px-1.5",
                onClick && "cursor-pointer",
                className,
            )}
            style={style}
            onClick={onClick}
        >
            {progress_prct > 0 && (
                <div
                    className={cn("absolute left-0 top-0 h-full", progressColor)}
                    style={{ width: `${progress_prct}%` }}
                />
            )}
            <div className="grow relative flex items-baseline gap-1.5">
                <span className="font-medium whitespace-nowrap">{order.ref}</span>
                {showClientName && <span className="opacity-80">{order.client}</span>}
                <span className="grow" />
                {showDuration && <span className="text-xs opacity-90 tabular-nums">({durationLabel})</span>}
                {progress_prct === 100 ? (
                    <Icon icon={faCheck} />
                ) : progress_prct > 0 ? (
                    <span className="font-medium tabular-nums">{progress_prct}%</span>
                ) : (
                    ""
                )}
            </div>
        </div>
    );
};
