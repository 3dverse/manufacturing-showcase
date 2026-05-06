import { SectionWrapper, Field, StatusBadge, Divider } from "@/components/correlation/SectionWrapper";
import { NodeLink } from "@/components/correlation/NodeLink";
import { fmtTs } from "@/utils/helpers-time";
import type { ProjectedPutawayTask } from "@/core/Projection";

type Props = {
    items: ProjectedPutawayTask[];
    focusedId: string | null;
    focusedClassName?: string;
};

export function PutawayTaskSheet({ items, focusedId, focusedClassName }: Props) {
    return (
        <SectionWrapper
            label="Putaway Tasks"
            items={items}
            focusedId={focusedId}
            focusedClassName={focusedClassName}
            getId={(e) => e.id}
            renderItem={(t) => (
                <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                            <p className="text-sm font-semibold leading-tight font-mono">{t.id}</p>
                            <p className="text-xs text-muted">{t.itemId}</p>
                        </div>
                        <div className="shrink-0 pt-px">
                            <StatusBadge status={t.status} />
                        </div>
                    </div>
                    <Divider />
                    <div className="space-y-1">
                        <Field label="Status" value={<span className="capitalize">{t.status}</span>} />
                        <Field label="Qty" value={t.quantity} />
                        <Field label="Created" value={fmtTs(t.createdAt)} />
                        {t.putawayDate && <Field label="Putaway" value={fmtTs(t.putawayDate)} />}
                        <Field label="From bin" value={<NodeLink hash={t.sourceLocationId} />} />
                        <Field label="To warehouse" value={<NodeLink hash={t.warehouseId} />} />
                        <Field label="To bin" value={<NodeLink hash={t.destinationLocationId} />} />
                    </div>
                </div>
            )}
        />
    );
}
