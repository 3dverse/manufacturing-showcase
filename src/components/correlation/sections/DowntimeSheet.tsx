//------------------------------------------------------------------------------
import { SectionWrapper, Field, OngoingBadge, Divider } from "@/components/correlation/SectionWrapper";

//------------------------------------------------------------------------------
import { fmtTs, fmtDuration } from "@/utils/helpers-time";

//------------------------------------------------------------------------------
import type { ProjectedDowntime } from "@/core/Projection";

//------------------------------------------------------------------------------
type Props = {
    items: ProjectedDowntime[];
    focusedId: string | null;
};

export function DowntimeSheet({ items, focusedId }: Props) {
    return (
        <SectionWrapper
            label="Downtime Events"
            items={items}
            focusedId={focusedId}
            getId={(e) => e.id}
            renderItem={(dt) => (
                <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                            <p className="text-sm font-semibold leading-tight text-red-700">{dt.reasonCode}</p>
                            {dt.reasonDescription && <p className="text-xs text-muted">{dt.reasonDescription}</p>}
                        </div>
                        <div className="shrink-0 pt-px">{dt.isOngoing && <OngoingBadge />}</div>
                    </div>
                    <Divider />
                    <div className="space-y-1">
                        <Field label="Started" value={fmtTs(dt.startedAt)} />
                        <Field
                            label="Ended"
                            value={dt.endedAt ? fmtTs(dt.endedAt) : <span className="text-orange-600">ongoing</span>}
                        />
                        <Field label="Duration" value={fmtDuration(dt.durationAtAsOf)} />
                        <Field label="Work center" value={dt.workCenterId} />
                    </div>
                </div>
            )}
        />
    );
}
