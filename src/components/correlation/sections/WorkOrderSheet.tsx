import { SectionWrapper, Field, StatusBadge, OverdueBadge, Divider } from "@/components/correlation/SectionWrapper";
import { fmtTs } from "@/utils/helpers-time";
import type { ProjectedWorkOrder } from "@/core/Projection";

type Props = {
    items: ProjectedWorkOrder[];
    focusedId: string | null;
    focusedClassName?: string;
};

export function WorkOrderSheet({ items, focusedId, focusedClassName }: Props) {
    return (
        <SectionWrapper
            label="EAM Work Orders"
            items={items}
            focusedId={focusedId}
            focusedClassName={focusedClassName}
            getId={(e) => e.id}
            renderItem={(wo) => (
                <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                            <p className="text-sm font-semibold leading-tight">{wo.workOrderNumber}</p>
                            <p className="text-xs text-muted capitalize">{wo.workType}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 pt-px">
                            <StatusBadge status={wo.status} />
                            {wo.projected.isOverdue && <OverdueBadge />}
                        </div>
                    </div>
                    <Divider />
                    <div className="space-y-1">
                        <Field
                            label="Status"
                            value={<span className="capitalize">{wo.status.replace(/_/g, " ")}</span>}
                        />
                        <Field label="Planned" value={`${fmtTs(wo.scheduledStart)} → ${fmtTs(wo.scheduledEnd)}`} />
                        {wo.actualStart && (
                            <Field
                                label="Actual"
                                value={
                                    wo.actualEnd
                                        ? `${fmtTs(wo.actualStart)} → ${fmtTs(wo.actualEnd)}`
                                        : `${fmtTs(wo.actualStart)} (ongoing)`
                                }
                            />
                        )}
                        <Field label="Asset" value={wo.assetId} />
                        {wo.locationId && <Field label="Location" value={wo.locationId} />}
                    </div>
                </div>
            )}
        />
    );
}
