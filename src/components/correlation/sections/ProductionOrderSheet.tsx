import { SectionWrapper, Field, StatusBadge, Divider } from "@/components/correlation/SectionWrapper";
import { fmtTs } from "@/utils/helpers-time";
import { cn } from "@/utils/cn";
import type { ProjectedProductionOrder } from "@/core/Projection";

type Props = {
    items: ProjectedProductionOrder[];
    focusedId: string | null;
    focusedClassName?: string;
};

export function ProductionOrderSheet({ items, focusedId, focusedClassName }: Props) {
    return (
        <SectionWrapper
            label="Manufacturing Orders"
            items={items}
            focusedId={focusedId}
            focusedClassName={focusedClassName}
            getId={(e) => e.id}
            renderItem={(po) => (
                <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                            <p className="text-sm font-semibold leading-tight">{po.orderNumber}</p>
                            <p className="text-xs text-muted">{po.itemCode}</p>
                        </div>
                        <div className="shrink-0 pt-px">
                            <StatusBadge status={po.status} />
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="my-2">
                        <div className="flex justify-between text-[10px] text-muted mb-1">
                            <span>
                                {po.quantities.producedQuantity} / {po.quantities.plannedQuantity} {po.quantities.uom}
                            </span>
                            <span>{po.projected.progressPercent}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    po.status === "completed"
                                        ? "bg-slate-400"
                                        : po.status === "planned"
                                          ? "bg-blue-300"
                                          : "bg-emerald-500",
                                )}
                                style={{ width: `${po.projected.progressPercent}%` }}
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
