//------------------------------------------------------------------------------
import { PanelLabel } from "@/components/common/panel";

//------------------------------------------------------------------------------
import { useDeliverySummary } from "@/hooks/useDeliverySummary";
import { useTimelineStore } from "@/store/useTimelineStore";
import { fmtDuration } from "@/components/timeline/timeUtils";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
function PickBar({ completed, total }: { completed: number; total: number }) {
    const pct = total > 0 ? (completed / total) * 100 : 0;
    return (
        <div className="flex items-center gap-2">
            <div className="relative flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className="absolute inset-y-0 left-0 bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-2xs text-muted/70 tabular-nums shrink-0">
                {completed}/{total}
            </span>
        </div>
    );
}

//------------------------------------------------------------------------------
export function DeliveryAreaSummary({ className }: { className?: string }) {
    const summary = useDeliverySummary();
    const asOf = useTimelineStore((s) => s.asOf);

    const { nextDue, isLoading } = summary;
    const timeToNextDue = nextDue ? nextDue.requestedDeliveryDate - asOf : null;

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
                {nextDue && timeToNextDue != null && (
                    <div className="flex items-baseline justify-between gap-2 pl-1 border-l-2 border-slate-200">
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
                )}
            </div>

            <div className="border-t border-slate-100" />

            {/* Pick tasks */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <PanelLabel className="text-xs">Pick tasks</PanelLabel>
                    {summary.pendingPickUnits > 0 && (
                        <span className="text-2xs text-muted/70">{summary.pendingPickUnits} units pending</span>
                    )}
                </div>
                {summary.totalPickCount > 0 ? (
                    <PickBar completed={summary.completedPickCount} total={summary.totalPickCount} />
                ) : (
                    <p className="text-xs text-muted/50">No picks scheduled</p>
                )}
            </div>

            <div className="border-t border-slate-100" />

            {/* Stock readiness */}
            <div className="flex items-baseline justify-between gap-4">
                <PanelLabel className="text-xs shrink-0">Stock reserved</PanelLabel>
                {summary.partialAllocCount > 0 ? (
                    <span className="text-xs font-medium text-warning">
                        {summary.partialAllocCount} gap{summary.partialAllocCount > 1 ? "s" : ""}
                    </span>
                ) : summary.totalAllocCount > 0 ? (
                    <span className="text-xs font-medium text-positive">Full</span>
                ) : (
                    <span className="text-xs text-muted/50">—</span>
                )}
            </div>
        </div>
    );
}
