//------------------------------------------------------------------------------
import { PanelLabel } from "@/components/common/panel";

//------------------------------------------------------------------------------
import { useReceptionSummary } from "@/hooks/useReceptionSummary";
import { useTimelineStore } from "@/store/useTimelineStore";
import { fmtDuration } from "@/components/timeline/timeUtils";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
function RelativeTime({ ts, asOf }: { ts: number; asOf: number }) {
    const diffSec = ts - asOf;
    const abs = Math.abs(diffSec);
    const label = fmtDuration(abs);
    return diffSec > 0 ? (
        <span className="text-accent">in {label}</span>
    ) : (
        <span className="text-muted/70">{label} ago</span>
    );
}

//------------------------------------------------------------------------------
function KpiRow({
    label,
    primary,
    secondary,
    className,
}: {
    label: string;
    primary: React.JSX.Element | string | number;
    secondary?: string;
    className?: string;
}) {
    return (
        <div className={cn("flex items-baseline justify-between gap-4", className)}>
            <PanelLabel className="text-xs shrink-0">{label}</PanelLabel>
            <div className="flex items-baseline gap-2 text-right">
                <span className="text-sm font-semibold tabular-nums leading-tight">{primary}</span>
                {secondary && <span className="text-2xs text-muted/70">{secondary}</span>}
            </div>
        </div>
    );
}

//------------------------------------------------------------------------------
export function ReceptionAreaSummary({ className }: { className?: string }) {
    const summary = useReceptionSummary();
    const asOf = useTimelineStore((s) => s.asOf);

    const { nextDelivery, isLoading } = summary;

    return (
        <div
            className={cn(
                "flex flex-col gap-3 min-w-56 transition-opacity duration-300",
                isLoading && "opacity-40",
                className,
            )}
        >
            {/* In transit */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <PanelLabel className="text-xs">In transit</PanelLabel>
                    <span
                        className={cn(
                            "text-lg font-semibold tabular-nums leading-none",
                            summary.activePOCount === 0 ? "text-muted/50" : "text-accent",
                        )}
                    >
                        {summary.activePOCount}
                        <span className="text-xs font-normal text-muted/70 ml-1">
                            PO{summary.activePOCount !== 1 ? "s" : ""}
                        </span>
                    </span>
                </div>
                {nextDelivery && (
                    <div className="flex items-baseline justify-between gap-2 pl-1 border-l-2 border-accent/30">
                        <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{nextDelivery.itemId}</p>
                            <p className="text-2xs text-muted/70 truncate">
                                {nextDelivery.supplierName ?? nextDelivery.supplierId}
                            </p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-xs tabular-nums">{nextDelivery.orderedQuantity} units</p>
                            {nextDelivery.expectedDeliveryDate && (
                                <p className="text-2xs">
                                    <RelativeTime ts={nextDelivery.expectedDeliveryDate} asOf={asOf} />
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="border-t border-slate-100" />

            {/* Received recently */}
            <KpiRow
                label="Received (24h)"
                primary={
                    summary.recentReceiptCount === 0 ? (
                        <span className="text-muted/50">—</span>
                    ) : (
                        summary.recentReceiptCount
                    )
                }
                secondary={summary.recentUnitCount > 0 ? `${summary.recentUnitCount} units` : undefined}
            />

            {/* Putaway backlog */}
            <KpiRow
                label="Putaway backlog"
                primary={
                    summary.pendingPutawayCount === 0 ? (
                        <span className="text-positive text-xs font-normal">Clear</span>
                    ) : (
                        <span className={summary.pendingPutawayCount > 3 ? "text-warning" : undefined}>
                            {summary.pendingPutawayCount}
                        </span>
                    )
                }
                secondary={summary.pendingPutawayUnits > 0 ? `${summary.pendingPutawayUnits} units` : undefined}
            />
        </div>
    );
}
