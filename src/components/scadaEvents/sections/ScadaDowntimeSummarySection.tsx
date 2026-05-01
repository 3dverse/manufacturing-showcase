import { Field, OngoingBadge } from "@/components/correlation/SectionWrapper";
import type { ProjectedDowntime } from "@/core/Projection";
import { fmtDuration, fmtTs } from "@/utils/helpers-time";

//------------------------------------------------------------------------------
type Props = {
    downtime: ProjectedDowntime;
};

//------------------------------------------------------------------------------
export function ScadaDowntimeSummarySection({ downtime: dt }: Props) {
    return (
        <section className="pb-4">
            <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-base font-semibold leading-tight text-warning-700">{dt.reasonDescription}</p>
                <div className="shrink-0">{dt.isOngoing && <OngoingBadge />}</div>
            </div>
            <div className="space-y-1">
                <Field label="Started" value={fmtTs(dt.startedAt)} />
                <Field
                    label="Ended"
                    value={dt.endedAt ? fmtTs(dt.endedAt) : <span className="text-orange-600">ongoing</span>}
                />
                <Field label="Duration" value={fmtDuration(dt.durationAtAsOf)} />
                <Field label="Work center" value={dt.workCenterId} />
            </div>
        </section>
    );
}
