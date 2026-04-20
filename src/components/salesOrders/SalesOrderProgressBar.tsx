//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";
import { faCheck } from "@fortawesome/sharp-solid-svg-icons";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import { orderStatus } from "@/content/orders";
import type { Order } from "@/content/type";

type SalesOrderProgressBarProps = {
    order: Order;
    size?: "md" | "lg";
    showClientName?: boolean;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
};

//------------------------------------------------------------------------------
export const SalesOrderProgressBar = ({
    order,
    size = "md",
    showClientName = false,
    className,
    style,
    onClick,
}: SalesOrderProgressBarProps) => {
    const progress = order.unitsPlanned > 0 ? Math.round((order.unitsCompleted / order.unitsPlanned) * 100) : 0;

    //--------------------------------------------------------------------------
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
            ? "bg-positive-700/70"
            : order.status.name === orderStatus.inProgress.name
              ? "bg-accent-600 stripes [--color:var(--color-accent-900)]"
              : "bg-neutral-500";

    //--------------------------------------------------------------------------
    return (
        <div
            className={cn(
                "relative flex items-center text-slate-0 rounded-sm overflow-hidden",
                barColor,
                order.status.name === orderStatus.planned.name && "opacity-50 group-hover:opacity-80",
                size === "lg" ? "text-sm pl-3 pr-2 py-1.5" : "text-2xs px-1.5",
                onClick && "cursor-pointer",
                className,
            )}
            style={style}
            onClick={onClick}
        >
            {progress > 0 && (
                <div className={cn("absolute left-0 top-0 h-full", progressColor)} style={{ width: `${progress}%` }} />
            )}
            <div className="grow relative flex gap-2">
                <span className="font-medium pointer-events-none whitespace-nowrap">{order.ref}</span>
                {showClientName && <span className="opacity-80">{order.client}</span>}
                <span className="grow" />
                <span className="font-medium pointer-events-none">
                    {progress === 100 ? <Icon icon={faCheck} /> : progress > 0 ? `${progress}%` : ""}
                </span>
            </div>
        </div>
    );
};
