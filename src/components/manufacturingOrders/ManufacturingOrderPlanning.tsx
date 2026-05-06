//------------------------------------------------------------------------------
import { useState, useMemo, useEffect, useRef } from "react";
import { faList, faTimeline } from "@fortawesome/pro-light-svg-icons";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";
import { PanelLabel } from "@/components/common/panel";
import Button from "@/components/common/Button";
import { ManufacturingOrderList } from "./ManufacturingOrderList";
import { ManufacturingOrderTimeline } from "./ManufacturingOrderTimeline";

//------------------------------------------------------------------------------
import { useHomePageData } from "@/hooks/useHomePageData";
import type { StoppageEvent } from "@/components/scadaEvents/StoppageCallout";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
type ViewMode = "list" | "timeline";

//------------------------------------------------------------------------------
export const ManufacturingOrderPlanning = ({
    siteId,
    onActiveStoppage,
}: {
    siteId: string;
    onActiveStoppage?: (stoppage: StoppageEvent | null) => void;
}) => {
    const [mode, setMode] = useState<ViewMode>("timeline");
    const { orders, downtimeEvents, eamWorkOrders, isLoading, refTs } = useHomePageData(siteId);

    const activeStoppage = useMemo((): StoppageEvent | null => {
        const refMs = refTs * 1000;
        const activeDowntime = downtimeEvents.find((e) => e.startMs <= refMs && e.endMs >= refMs) ?? null;
        if (activeDowntime) return activeDowntime;
        return (
            eamWorkOrders.find((wo) => {
                const startMs = (wo.actualStart ?? wo.scheduledStart) * 1000;
                const endMs = (wo.actualEnd ?? wo.scheduledEnd) * 1000;
                return startMs <= refMs && endMs >= refMs;
            }) ?? null
        );
    }, [downtimeEvents, eamWorkOrders, refTs]);

    const onActiveStoppageRef = useRef(onActiveStoppage);
    onActiveStoppageRef.current = onActiveStoppage;

    useEffect(() => {
        onActiveStoppageRef.current?.(activeStoppage);
    }, [activeStoppage]);

    //--------------------------------------------------------------------------
    return (
        <div className="@container flex flex-col gap-1">
            <header className="flex justify-between items-center gap-2 mb-1">
                <PanelLabel className="text-sm text-default font-medium">Manufacturing Order Planning</PanelLabel>
                <div className="flex items-center rounded-sm border border-muted p-px">
                    <Button
                        title="Timeline view"
                        variant="ghost"
                        size="sm"
                        onClick={() => setMode("timeline")}
                        className={cn(
                            "w-auto p-1.5 rounded-sm",
                            mode === "timeline"
                                ? "bg-accent/80! text-accent-50!"
                                : "text-muted hover:text-default hover:bg-underground",
                        )}
                    >
                        <Icon icon={faTimeline} size="xs" />
                    </Button>
                    <Button
                        title="List view"
                        variant="ghost"
                        size="sm"
                        onClick={() => setMode("list")}
                        className={cn(
                            "w-auto p-1.5 rounded-sm",
                            mode === "list"
                                ? "bg-accent/80! text-accent-50!"
                                : "text-muted hover:text-default hover:bg-underground",
                        )}
                    >
                        <Icon icon={faList} size="xs" />
                    </Button>
                </div>
            </header>

            {mode === "list" ? (
                <ManufacturingOrderList orders={orders} isLoading={isLoading} />
            ) : (
                <ManufacturingOrderTimeline
                    orders={orders}
                    downtimeEvents={downtimeEvents}
                    eamWorkOrders={eamWorkOrders}
                    isLoading={isLoading}
                    refTs={refTs}
                />
            )}
            <footer className="w-full flex justify-between items-center mt-1 px-px">
                <p className="flex items-center gap-1 text-2xs text-muted/80">
                    <img src="/logo/sap.svg" alt="SAP" className="h-3" />
                    Updated 10s ago
                </p>
                <a href="#" className="text-2xs text-accent">
                    All orders
                </a>
            </footer>
        </div>
    );
};
