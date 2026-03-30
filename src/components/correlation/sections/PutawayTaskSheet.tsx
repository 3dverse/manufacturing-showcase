import { SectionWrapper, Field, PhaseBadge, Divider } from "@/components/correlation/SectionWrapper";
import { fmtTs } from "@/components/timeline/timeUtils";
import type { ProjectedPutawayTask } from "@/core/Projection";

type Props = {
    items: ProjectedPutawayTask[];
    focusedId: string | null;
};

export function PutawayTaskSheet({ items, focusedId }: Props) {
    return (
        <SectionWrapper
            label="Putaway Tasks"
            items={items}
            focusedId={focusedId}
            getId={(e) => e.id}
            renderItem={(t) => (
                <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                            <p className="text-sm font-semibold leading-tight font-mono">{t.id}</p>
                            <p className="text-xs text-muted">{t.itemId}</p>
                        </div>
                        <div className="shrink-0 pt-px">
                            <PhaseBadge phase={t.phase} />
                        </div>
                    </div>
                    <Divider />
                    <div className="space-y-1">
                        <Field label="Status" value={<span className="capitalize">{t.status}</span>} />
                        <Field label="Qty" value={t.quantity} />
                        <Field label="Created" value={fmtTs(t.createdAt)} />
                        {t.putawayDate && <Field label="Putaway" value={fmtTs(t.putawayDate)} />}
                        <Field label="Warehouse" value={t.warehouseId} />
                    </div>
                </div>
            )}
        />
    );
}
