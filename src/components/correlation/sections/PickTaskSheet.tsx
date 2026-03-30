import { SectionWrapper, Field, PhaseBadge, Divider } from "@/components/correlation/SectionWrapper";
import { fmtTs } from "@/components/timeline/timeUtils";
import type { ProjectedPickTask } from "@/core/Projection";

type Props = {
    items: ProjectedPickTask[];
    focusedId: string | null;
};

export function PickTaskSheet({ items, focusedId }: Props) {
    return (
        <SectionWrapper
            label="Pick Tasks"
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
                        <Field label="Qty" value={`${t.quantity} ${t.uom}`} />
                        <Field label="Created" value={fmtTs(t.createdAt)} />
                        {t.pickedDate && <Field label="Picked" value={fmtTs(t.pickedDate)} />}
                        <Field label="Warehouse" value={t.warehouseId} />
                    </div>
                </div>
            )}
        />
    );
}
