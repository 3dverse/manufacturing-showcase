//------------------------------------------------------------------------------
import React, { useCallback, useMemo } from "react";

//------------------------------------------------------------------------------
import { PanelLabel } from "@/components/common/panel";
import { ProgressBar } from "@/components/common/ProgressBar";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { Order } from "@/content/type";

//------------------------------------------------------------------------------
interface FactoryOrderPanelProps {
    order: Order;
    className?: string;
}

//------------------------------------------------------------------------------
export const FactoryOrderPanel: React.FC<FactoryOrderPanelProps> = ({ order, className }) => {
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
            <header className="flex items-start justify-between px-1 pb-3">
                <div className="pt-px">
                    <PanelLabel className="text-xs">Current Order</PanelLabel>
                    <p className="mt-px -ml-px text-lg leading-tight font-semibold tabular-nums tracking-tight">
                        {order.ref}
                    </p>
                    <p className="text-2xs text-accent">Client {order.client}</p>
                </div>
                <div className="flex flex-col items-end pt-2 pr-1">
                    <div className="pt-1 text-2xl tabular-nums tracking-tighter leading-5 ">
                        <span className="text-accent font-normal">{order.unitsCompleted}</span> /{" "}
                        <span className="font-semibold">{order.unitsPlanned}</span>
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

            <footer className="mt-4 flex justify-between">
                <p className="ml-px flex items-center gap-1 w-fit text-2xs text-muted rounded-sm bg-slate-50 hover:text-subtle hover:bg-slate-100 transition-colors duration-200 pl-px pr-2 py-px cursor-pointer">
                    <img src="/logo/sap.svg" alt="SAP" className="h-3" />
                    Updated 10s ago
                </p>
                <div className="flex items-center gap-2">
                    <p className="text-2xs text-muted/80">No delay</p>
                    <p className="text-2xs text-muted/80">No incidents reported</p>
                </div>
            </footer>
        </div>
    );
};
