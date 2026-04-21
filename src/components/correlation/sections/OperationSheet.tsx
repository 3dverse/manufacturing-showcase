import { SectionWrapper, Field, PhaseBadge, Divider } from "@/components/correlation/SectionWrapper";
import { fmtTs } from "@/utils/helpers-time";
import { cn } from "@/utils/cn";
import type { ProjectedOperation } from "@/core/Projection";

type Props = {
    items: ProjectedOperation[];
    focusedId: string | null;
};

export function OperationSheet({ items, focusedId }: Props) {
    return (
        <SectionWrapper
            label="Operations"
            items={items}
            focusedId={focusedId}
            getId={(e) => e.id}
            renderItem={(op) => (
                <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                            <p className="text-sm font-semibold leading-tight">{op.operationCode}</p>
                            {op.operationDescription && <p className="text-xs text-muted">{op.operationDescription}</p>}
                        </div>
                        <div className="shrink-0 pt-px">
                            <PhaseBadge phase={op.phase} />
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="my-2">
                        <div className="flex justify-between text-[10px] text-muted mb-1">
                            <span>
                                {op.quantities.producedQuantity} / {op.quantities.plannedQuantity} {op.quantities.uom}
                            </span>
                            <span>{op.progressPercent}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    op.phase === "completed"
                                        ? "bg-slate-400"
                                        : op.phase === "future"
                                          ? "bg-blue-300"
                                          : "bg-emerald-500",
                                )}
                                style={{ width: `${op.progressPercent}%` }}
                            />
                        </div>
                    </div>

                    <Divider />
                    <div className="space-y-1">
                        <Field label="Sequence" value={op.sequence} />
                        <Field
                            label="Status"
                            value={<span className="capitalize">{op.status.replace(/_/g, " ")}</span>}
                        />
                        <Field label="Planned" value={`${fmtTs(op.scheduledStart)} → ${fmtTs(op.scheduledEnd)}`} />
                        {op.actualStart && (
                            <Field
                                label="Actual"
                                value={
                                    op.actualEnd
                                        ? `${fmtTs(op.actualStart)} → ${fmtTs(op.actualEnd)}`
                                        : `${fmtTs(op.actualStart)} (ongoing)`
                                }
                            />
                        )}
                        {op.actualRunTimeMinutes != null && (
                            <Field
                                label="Run time"
                                value={`${op.actualRunTimeMinutes}min (planned ${op.plannedRunTimeMinutes}min)`}
                            />
                        )}
                        <Field label="Work center" value={op.workCenterId} />
                    </div>
                </div>
            )}
        />
    );
}
