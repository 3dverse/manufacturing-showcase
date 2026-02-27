//------------------------------------------------------------------------------
import React, { useCallback, useMemo } from "react";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";
import { PanelLabel } from "@/components/common/panel";
import { ProgressBar } from "@/components/common/ProgressBar";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { Order } from "@/content/type";

//------------------------------------------------------------------------------
interface OrderPanelProps {
    order: Order;
    className?: string;
}

//------------------------------------------------------------------------------
export const OrderPanel: React.FC<OrderPanelProps> = ({ order, className }) => {
    //--------------------------------------------------------------------------
    const elapsedTime = useMemo(() => {
        const startDate = new Date(order.startDate);
        const endDate = new Date(order.endDate);
        const diffTime = endDate.getTime() - startDate.getTime();
        const diffHours = diffTime / (1000 * 60 * 60);
        const diffMinutes = (diffTime % (1000 * 60 * 60)) / (1000 * 60);
        return `${Math.floor(diffHours)}:${Math.floor(diffMinutes)}`;
    }, [order.startDate, order.endDate]);

    //--------------------------------------------------------------------------
    const formatDate = useCallback((date: Date) => {
        const now = new Date();
        const diffTime = now.getTime() - date.getTime();
        const diffHours = diffTime / (1000 * 60 * 60);
        const diffMinutes = (diffTime % (1000 * 60 * 60)) / (1000 * 60);
        return `${Math.floor(diffHours)}h${Math.floor(diffMinutes)}`;
    }, []);

    //--------------------------------------------------------------------------
    return (
        <div className={cn("@container flex flex-col", className)}>
            <header className="flex items-start justify-between px-1 pb-2">
                <div>
                    <PanelLabel className="text-xs text-default">Current Order</PanelLabel>

                    <p className="text-accent text-base font-medium tabular-nums tracking-wide">
                        <Icon icon={order.status.icon} className="text-xs text-accent-400 mr-1 -translate-y-[2px]" />
                        {order.ref}
                    </p>
                </div>
                <div className="flex flex-col items-end py-1 pr-1">
                    <div className="text-xl  tabular-nums tracking-tighter leading-5">
                        <span className="text-accent font-semibold">{order.unitsCompleted}</span> / {order.unitsPlanned}
                    </div>
                    <p className="text-2xs">Units</p>
                </div>
            </header>

            <ProgressBar
                progress={order.unitsCompleted / order.unitsPlanned}
                leftMarker={`Started today at ${formatDate(order.startDate)} `}
                rightMarker={`End today at ${formatDate(order.endDate)}`}
                elapsedTime={elapsedTime}
            />
        </div>
    );
};
