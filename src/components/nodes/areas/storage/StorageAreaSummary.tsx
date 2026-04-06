//------------------------------------------------------------------------------
import { useEffect, useMemo, useState } from "react";

//------------------------------------------------------------------------------
import { PanelLabel } from "@/components/common/panel";
import { useStorageSummary } from "@/hooks/useStorageSummary";
import { useTimelineStore } from "@/store/useTimelineStore";
import { useFactoryStore } from "@/store/useFactoryStore";
import { getBinOccupancy, type BinOccupancy } from "@/core/occupancy";
import { itemColor } from "@/utils/itemColor";
import { cn } from "@/utils/cn";
import type { AreaNode } from "@/content/type";

//------------------------------------------------------------------------------
export function StorageAreaSummary({ areaNode, className }: { areaNode: AreaNode; className?: string }) {
    const summary = useStorageSummary();
    const asOf = useTimelineStore((s) => s.asOf);
    const siteId = useFactoryStore((s) => s.currentFactory?.scene_id ?? "");

    // Bin IDs — real bins from aisles if present, otherwise single zone fallback
    const { binIds, totalBins } = useMemo(() => {
        const bins = areaNode.aisles.flatMap((a) => a.racks.flatMap((r) => r.bins));
        if (bins.length > 0) return { binIds: bins.map((b) => b.hash), totalBins: bins.length };
        return { binIds: [`${areaNode.hash}-BIN-01`], totalBins: 1 };
    }, [areaNode]);

    const [occupancy, setOccupancy] = useState<Map<string, BinOccupancy[]>>(new Map());
    useEffect(() => {
        if (!siteId) return;
        getBinOccupancy({ siteId, warehouseId: areaNode.hash, binIds, asOf }).then(setOccupancy);
    }, [siteId, areaNode.hash, binIds, asOf]);

    const { occupiedBins, unitsByItem } = useMemo(() => {
        let occupied = 0;
        const byItem = new Map<string, number>();
        for (const items of occupancy.values()) {
            if (items.length > 0) occupied++;
            for (const o of items) {
                byItem.set(o.itemId, (byItem.get(o.itemId) ?? 0) + o.quantity);
            }
        }
        const unitsByItem = [...byItem.entries()]
            .map(([itemId, quantity]) => ({ itemId, quantity }))
            .sort((a, b) => b.quantity - a.quantity);
        return { occupiedBins: occupied, unitsByItem };
    }, [occupancy]);

    return (
        <div
            className={cn(
                "flex flex-col gap-3 min-w-56 transition-opacity duration-300",
                summary.isLoading && "opacity-40",
                className,
            )}
        >
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
                {unitsByItem.length === 0 ? (
                    <div className="flex items-center justify-between">
                        <PanelLabel className="text-xs">Units in storage</PanelLabel>
                        <span className="text-sm font-medium tabular-nums text-muted/40">0</span>
                    </div>
                ) : (
                    <div className="flex flex-col gap-0.5">
                        <PanelLabel className="text-xs">Inventory</PanelLabel>
                        {unitsByItem.map(({ itemId, quantity }) => (
                            <div key={itemId} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span
                                        className="shrink-0 w-2 h-2 rounded-full"
                                        style={{ backgroundColor: itemColor(itemId) }}
                                    />
                                    <span className="text-2xs text-muted/70 truncate">{itemId}</span>
                                </div>
                                <span className="text-xs font-medium tabular-nums text-default shrink-0">
                                    {quantity}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="border-t border-slate-100" />

            {/* Manufacturing orders */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <PanelLabel className="text-xs">Fully allocated MOs</PanelLabel>
                    <div className="flex items-baseline gap-2">
                        <span
                            className={cn(
                                "text-lg font-semibold tabular-nums leading-none",
                                summary.totalMoCount === 0 ? "text-muted/50" : "text-default",
                            )}
                        >
                            {summary.fullyAllocatedMoCount}
                            <span className="text-xs font-normal text-muted/50"> / {summary.totalMoCount}</span>
                        </span>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <PanelLabel className="text-xs">Inbound POs</PanelLabel>
                    <div className="flex items-baseline gap-2">
                        <span
                            className={cn(
                                "text-sm font-medium tabular-nums",
                                summary.openPoCount === 0 ? "text-muted/40" : "text-default",
                            )}
                        >
                            {summary.openPoCount}
                        </span>
                        {summary.overduePoCount > 0 && (
                            <span className="text-xs font-medium text-negative">{summary.overduePoCount} overdue</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
