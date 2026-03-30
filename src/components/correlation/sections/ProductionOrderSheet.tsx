import { SectionWrapper, Field, PhaseBadge, Divider } from "@/components/correlation/SectionWrapper";
import { fmtTs } from "@/components/timeline/timeUtils";
import { cn } from "@/utils/cn";
import type { ProjectedProductionOrder } from "@/core/Projection";

type Props = {
    items: ProjectedProductionOrder[];
    focusedId: string | null;
};

export function ProductionOrderSheet({ items, focusedId }: Props) {
    return (
        <SectionWrapper
            label="Production Orders"
            items={items}
            focusedId={focusedId}
            getId={(e) => e.id}
            renderItem={(po) => (
                <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                            <p className="text-sm font-semibold leading-tight">{po.orderNumber}</p>
                            <p className="text-xs text-muted">{po.itemCode}</p>
                        </div>
                        <div className="shrink-0 pt-px">
                            <PhaseBadge phase={po.phase} />
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="my-2">
                        <div className="flex justify-between text-[10px] text-muted mb-1">
                            <span>
                                {po.quantities.producedQuantity} / {po.quantities.plannedQuantity} {po.quantities.uom}
                            </span>
                            <span>{po.progressPercent}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    po.phase === "completed"
                                        ? "bg-slate-400"
                                        : po.phase === "future"
                                          ? "bg-blue-300"
                                          : "bg-emerald-500",
                                )}
                                style={{ width: `${po.progressPercent}%` }}
                            />
                        </div>
                    </div>

                    <Divider />
                    <div className="space-y-1">
                        <Field
                            label="Status"
                            value={<span className="capitalize">{po.status.replace(/_/g, " ")}</span>}
                        />
                        <Field
                            label="Planned"
                            value={`${fmtTs(po.timing.scheduledStart)} → ${fmtTs(po.timing.scheduledEnd)}`}
                        />
                        {po.timing.actualStart && (
                            <Field
                                label="Actual"
                                value={
                                    po.timing.actualEnd
                                        ? `${fmtTs(po.timing.actualStart)} → ${fmtTs(po.timing.actualEnd)}`
                                        : `${fmtTs(po.timing.actualStart)} (ongoing)`
                                }
                            />
                        )}
                        <Field label="Location" value={po.locationId} />
                    </div>
                </div>
            )}
        />
    );
}
