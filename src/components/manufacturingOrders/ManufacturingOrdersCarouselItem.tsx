//------------------------------------------------------------------------------
import { useMemo } from "react";
import { faCheck, faListCheck } from "@fortawesome/sharp-light-svg-icons";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";
import Button from "@/components/common/Button";
import { ManufacturingOrderProgressBar } from "@/components/manufacturingOrders/ManufacturingOrderProgressBar";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";
import { timeAgo } from "@/utils/helpers-time";

//------------------------------------------------------------------------------
import { orderStatus } from "@/content/orders";
import type { Order } from "@/content/type";

//------------------------------------------------------------------------------
type ManufacturingOrdersCarouselItemProps = {
    order: Order;
    now: number;
};

//------------------------------------------------------------------------------
export const ManufacturingOrdersCarouselItem = ({ order, now }: ManufacturingOrdersCarouselItemProps) => {
    //--------------------------------------------------------------------------
    const isNotStarted = order.status.name === orderStatus.planned.name;
    const nowDate = new Date(now);
    const endRelative = timeAgo(order.endDate, nowDate);
    const endRelativeWithoutIn = endRelative.startsWith("in ") ? endRelative.slice(3) : endRelative;
    const endLabel = order.endDate.getTime() <= now ? `Ended ${endRelative}` : `End in ${endRelativeWithoutIn}`;
    const statusTone =
        order.status.name === orderStatus.completed.name
            ? "text-positive-700"
            : order.status.name === orderStatus.inProgress.name
              ? "text-accent"
              : order.status.name === orderStatus.cancelled.name
                ? "text-negative-900"
                : "text-neutral/50";

    //--------------------------------------------------------------------------
    const unitsDisplay = useMemo(() => {
        if (order.status.name === orderStatus.completed.name) {
            return order.unitsCompleted;
        }
        if (order.status.name === orderStatus.inProgress.name) {
            return (
                <>
                    {order.unitsCompleted}
                    <span className="pl-1 text-2xl font-semibold tracking-normal">/{order.unitsPlanned}</span>
                </>
            );
        }
        return order.unitsPlanned;
    }, [order.status.name, order.unitsCompleted, order.unitsPlanned]);

    //--------------------------------------------------------------------------
    const unitsLabel = useMemo(() => {
        if (order.status.name === orderStatus.completed.name) {
            return "Units shipped";
        }
        if (order.status.name === orderStatus.inProgress.name) {
            return "Units ready to ship";
        }
        return "Units planned";
    }, [order.status.name]);

    //--------------------------------------------------------------------------
    const delayLabel = useMemo(() => {
        if (order.status.name === orderStatus.completed.name) {
            return (
                <Button variant="soft" colorScheme="positive" size="2xs">
                    <Icon icon={faCheck} className="w-3 mr-1 text-positive-700" />
                    No delay
                </Button>
            );
        }
        if (order.status.name === orderStatus.inProgress.name) {
            return (
                <p className="text-xs">
                    <Icon icon={faCheck} className="w-3 mr-1 text-positive-700" />
                    On time
                </p>
            );
        }
        return (
            <p className="text-xs text-slate-700">
                <Icon icon={faListCheck} className="w-3 mr-1 text-slate-700" />
                Ready
            </p>
        );
    }, [order.status.name]);

    //--------------------------------------------------------------------------
    return (
        <div
            data-order-ref={order.ref}
            className={cn("pointer-events-auto snap-center shrink-0 w-[min(42rem,92%)] overflow-hidden", statusTone)}
        >
            <div className="flex justify-between items-end mb-1">
                <p className="flex flex-col">
                    <span className="text-6xl font-bold tracking-tight leading-none -translate-x-px translate-y-1">
                        {unitsDisplay}
                    </span>
                    <span className="text-sm font-medium">{unitsLabel}</span>
                </p>
                <div className="flex flex-col text-sm text-right">
                    {delayLabel}
                    <p className="font-medium">
                        {isNotStarted ? `Start ${timeAgo(order.startDate, nowDate)}` : endLabel}
                    </p>
                </div>
            </div>
            <ManufacturingOrderProgressBar order={order} size="lg" showClientName showDuration />
        </div>
    );
};
