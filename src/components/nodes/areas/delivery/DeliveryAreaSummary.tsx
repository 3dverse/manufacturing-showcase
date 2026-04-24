//------------------------------------------------------------------------------
import { useEffect, useMemo, useState } from "react";

//------------------------------------------------------------------------------
import { PanelLabel } from "@/components/common/panel";

//------------------------------------------------------------------------------
import { useDeliverySummary } from "@/hooks/useDeliverySummary";
import { useTimelineStore } from "@/store/useTimelineStore";
import { useFactoryStore } from "@/store/useFactoryStore";

//------------------------------------------------------------------------------
import { fmtDuration } from "@/utils/helpers-time";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import { getBinOccupancy, type BinOccupancy } from "@/core/occupancy";

//------------------------------------------------------------------------------
import type { AreaNode } from "@/content/type";

//------------------------------------------------------------------------------
export function DeliveryAreaSummary({ areaNode, className }: { areaNode: AreaNode; className?: string }) {
    const summary = useDeliverySummary();
    const asOf = useTimelineStore((s) => s.asOf);
    const home = useTimelineStore((s) => s.home);
    const siteId = useFactoryStore((s) => s.currentFactory?.scene_id ?? "");

    const { nextDue, isLoading } = summary;
    const timeToNextDue = nextDue ? nextDue.requestedDeliveryDate - (asOf || home) : null;

    // Bin IDs — real bins from aisles if present, otherwise single zone fallback
    const { binIds, totalBins } = useMemo(() => {
        const bins = areaNode.aisles.flatMap((a) => a.racks.flatMap((r) => r.bins));
        if (bins.length > 0) return { binIds: bins.map((b) => b.hash), totalBins: bins.length };
        return { binIds: [`${areaNode.hash}-BIN-01`], totalBins: 1 };
    }, [areaNode]);

    const [occupancy, setOccupancy] = useState<Map<string, BinOccupancy[]>>(new Map());
    useEffect(() => {
        if (!siteId) return;
        getBinOccupancy({ siteId, warehouseId: areaNode.hash, binIds, asOf: asOf || home }).then(setOccupancy);
    }, [siteId, areaNode.hash, binIds, asOf, home]);

    const { occupiedBins, totalUnits } = useMemo(() => {
        let occupied = 0;
        let units = 0;
        for (const items of occupancy.values()) {
            if (items.length > 0) occupied++;
            units += items.reduce((s, o) => s + o.quantity, 0);
        }
        return { occupiedBins: occupied, totalUnits: units };
    }, [occupancy]);

    return (
        <div
            className={cn(
                "flex flex-col gap-3 min-w-56 transition-opacity duration-300",
                isLoading && "opacity-40",
                className,
            )}
        >
            {/* Open orders */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <PanelLabel className="text-xs">Open orders</PanelLabel>
                    <div className="flex items-baseline gap-2">
                        <span
                            className={cn(
                                "text-lg font-semibold tabular-nums leading-none",
                                summary.openOrderCount === 0 ? "text-muted/50" : "text-default",
                            )}
                        >
                            {summary.openOrderCount}
                        </span>
                        {summary.overdueCount > 0 && (
                            <span className="text-xs font-medium text-negative">{summary.overdueCount} overdue</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <PanelLabel className="text-xs">Stocked in delivery</PanelLabel>
                    <span
                        className={cn(
                            "text-sm font-medium tabular-nums",
                            summary.stockedOrderCount === 0 ? "text-muted/40" : "text-positive",
                        )}
                    >
                        {summary.stockedOrderCount}
                    </span>
                </div>
                {nextDue && timeToNextDue != null && (
                    <div className="flex flex-col gap-1 pl-1 border-l-2 border-slate-200">
                        <PanelLabel className="text-xs">Next order</PanelLabel>
                        <div className="flex items-baseline justify-between gap-2">
                            <p className="text-xs text-muted/80 truncate">Client {nextDue.customerId}</p>
                            <p className="text-2xs shrink-0">
                                {timeToNextDue > 0 ? (
                                    <span className={timeToNextDue < 86400 ? "text-warning" : "text-muted/70"}>
                                        due in {fmtDuration(timeToNextDue)}
                                    </span>
                                ) : (
                                    <span className="text-negative">{fmtDuration(-timeToNextDue)} overdue</span>
                                )}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="border-t border-slate-100" />

            {/* Occupancy */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <PanelLabel className="text-xs">Occupancy</PanelLabel>
                    <span className="text-2xs text-muted/70 tabular-nums">
                        {occupiedBins} / {totalBins} bins
                    </span>
                </div>
                <div className="relative h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="absolute inset-y-0 left-0 bg-accent rounded-full transition-all duration-500"
                        style={{ width: totalBins > 0 ? `${(occupiedBins / totalBins) * 100}%` : "0%" }}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <PanelLabel className="text-xs">Units staged</PanelLabel>
                    <span
                        className={cn(
                            "text-sm font-medium tabular-nums",
                            totalUnits === 0 ? "text-muted/40" : "text-default",
                        )}
                    >
                        {totalUnits}
                    </span>
                </div>
            </div>
        </div>
    );
}
