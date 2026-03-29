//------------------------------------------------------------------------------
import React, { useCallback, useMemo } from "react";

//------------------------------------------------------------------------------
import { PanelLabel } from "@/components/common/panel";
import { ProgressBar } from "@/components/common/ProgressBar";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";
import { useCurrentProductionOrder } from "@/hooks/useCurrentProductionOrder";

//------------------------------------------------------------------------------
interface ProductionAreaSummaryProps {
    className?: string;
}

//------------------------------------------------------------------------------
export const ProductionAreaSummary: React.FC<ProductionAreaSummaryProps> = ({ className }) => {
    //--------------------------------------------------------------------------
    const currentPO = useCurrentProductionOrder();

    //--------------------------------------------------------------------------
    const elapsedTime = useMemo(() => {
        if (!currentPO) return "";
        const diffSec = currentPO.effectiveEnd - currentPO.effectiveStart;
        const hours = Math.floor(diffSec / 3600);
        const minutes = Math.floor((diffSec % 3600) / 60);
        return `${hours}:${String(minutes).padStart(2, "0")}`;
    }, [currentPO]);

    //--------------------------------------------------------------------------
    // Returns how long ago (or until) a unix-second timestamp is, e.g. "2h30"
    const formatTimestamp = useCallback((ts: number) => {
        const nowSec = Math.floor(Date.now() / 1000);
        const diffSec = Math.abs(nowSec - ts);
        const hours = Math.floor(diffSec / 3600);
        const minutes = Math.floor((diffSec % 3600) / 60);
        return `${hours}h${String(minutes).padStart(2, "0")}`;
    }, []);

    //--------------------------------------------------------------------------
    if (!currentPO) return null;

    const progress = currentPO.plannedQuantity > 0 ? currentPO.producedQuantity / currentPO.plannedQuantity : 0;

    const isFuture = currentPO.phase === "future";
    const leftMarker = isFuture
        ? `Starts in ${formatTimestamp(currentPO.effectiveStart)}`
        : `Started ${formatTimestamp(currentPO.effectiveStart)} ago`;
    const rightMarker = isFuture
        ? `Planned end in ${formatTimestamp(currentPO.effectiveEnd)}`
        : `End ${formatTimestamp(currentPO.effectiveEnd)} ago`;

    //--------------------------------------------------------------------------
    return (
        <div className={cn("@container flex flex-col", className)}>
            <header className="flex items-start justify-between px-1 pb-3">
                <div className="pt-px">
                    <PanelLabel className="text-xs">{isFuture ? "Next Order" : "Current Order"}</PanelLabel>
                    <p className="mt-px -ml-px text-lg leading-tight font-semibold tabular-nums tracking-tight">
                        {currentPO.orderNumber}
                    </p>
                    <p className="text-2xs text-accent">Client {currentPO.customerId ?? "—"}</p>
                </div>
                <div className="flex flex-col items-end pt-2 pr-1">
                    <div className="pt-1 text-2xl tabular-nums tracking-tighter leading-5 ">
                        <span className="text-accent font-normal">{currentPO.producedQuantity}</span> /{" "}
                        <span className="font-semibold">{currentPO.plannedQuantity}</span>
                    </div>
                    <p className="text-2xs">Units</p>
                </div>
            </header>

            <ProgressBar
                progress={progress}
                leftMarker={leftMarker}
                rightMarker={rightMarker}
                elapsedTime={elapsedTime}
            />

            <footer className="mt-4 flex justify-between">
                <p className="ml-px flex items-center gap-1 w-fit text-2xs text-muted rounded-sm bg-slate-50 hover:text-subtle hover:bg-slate-100 transition-colors duration-200 pl-px pr-2 py-px cursor-pointer">
                    <img src="/logo/sap.svg" alt="SAP" className="h-3" />
                    Updated 10s ago
                </p>
                <div className="flex items-center gap-2">
                    {currentPO.totalDowntimeMinutes > 0 ? (
                        <p className="text-2xs text-muted/80">{currentPO.totalDowntimeMinutes}min downtime</p>
                    ) : (
                        <p className="text-2xs text-muted/80">No delay</p>
                    )}
                    {currentPO.activeDowntimeCount > 0 ? (
                        <p className="text-2xs text-negative">
                            {currentPO.activeDowntimeCount} active incident
                            {currentPO.activeDowntimeCount > 1 ? "s" : ""}
                        </p>
                    ) : currentPO.downtimeCount > 0 ? (
                        <p className="text-2xs text-muted/80">
                            {currentPO.downtimeCount} incident{currentPO.downtimeCount > 1 ? "s" : ""}
                        </p>
                    ) : (
                        <p className="text-2xs text-muted/80">No incidents reported</p>
                    )}
                </div>
            </footer>
        </div>
    );
};
