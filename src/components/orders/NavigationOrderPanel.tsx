//------------------------------------------------------------------------------
import { useCallback, useMemo } from "react";

//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import type { Order } from "@/content/type";

//------------------------------------------------------------------------------
import { ProgressBar } from "@/components/common/ProgressBar";
import { PanelLabel } from "@/components/common/panel/PanelLabel";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export const NavigationOrderPanel = ({ order, className }: { order: Order; className?: string }) => {
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
    // Render
    return (
        <ViewerPanel
            as="article"
            className={cn(
                "@container flex justify-between items-center gap-16 w-full max-w-[80vw] px-4 py-2 pointer-events-auto",
                className,
            )}
        >
            <header className="flex flex-col items-start justify-between">
                <div className="pt-px">
                    <PanelLabel className="text-xs">Current Order</PanelLabel>
                    <p className="mt-px -ml-px text-lg leading-tight font-semibold tabular-nums tracking-tight">
                        {order.ref}
                    </p>
                    <p className="text-2xs text-accent">Client {order.client}</p>
                </div>
                <div className="mt-4 flex justify-between">
                    <p className="ml-px flex items-center gap-1 w-fit text-2xs text-muted rounded-sm bg-slate-50 hover:text-subtle hover:bg-slate-100 transition-colors duration-200 pl-px pr-2 py-px cursor-pointer">
                        <img src="/logo/sap.svg" alt="SAP" className="h-3" />
                        Updated 10s ago
                    </p>
                    <div className="flex items-center gap-2">
                        <p className="text-2xs text-muted/80">No delay</p>
                        <p className="text-2xs text-muted/80">No incidents reported</p>
                    </div>
                </div>
            </header>

            <ProgressBar
                progress={order.unitsCompleted / order.unitsPlanned}
                leftMarker={`Started today at ${formatDate(order.startDate)} `}
                rightMarker={`End today at ${formatDate(order.endDate)}`}
                elapsedTime={elapsedTime}
                className="h-fit flex-1"
            />

            <div className="flex flex-col items-end pt-2 pr-1">
                <div className="pt-1 text-2xl tabular-nums tracking-tighter leading-5 ">
                    <span className="text-accent font-normal">{order.unitsCompleted}</span> /{" "}
                    <span className="font-semibold">{order.unitsPlanned}</span>
                </div>
                <p className="text-2xs">Units</p>
            </div>
        </ViewerPanel>
    );
};
