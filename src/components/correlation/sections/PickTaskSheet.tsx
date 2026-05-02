import { SectionWrapper, Field, StatusBadge, Divider } from "@/components/correlation/SectionWrapper";
import { NodeLink } from "@/components/correlation/NodeLink";
import { fmtTs } from "@/utils/helpers-time";
import type { ProjectedPickTask } from "@/core/Projection";

type Props = {
    items: ProjectedPickTask[];
    focusedId: string | null;
    focusedClassName?: string;
};

export function PickTaskSheet({ items, focusedId, focusedClassName }: Props) {
    return (
        <SectionWrapper
            label="Pick Tasks"
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
                        <Field label="Qty" value={`${t.quantity} ${t.uom}`} />
                        <Field label="Created" value={fmtTs(t.createdAt)} />
                        {t.pickedDate && <Field label="Picked" value={fmtTs(t.pickedDate)} />}
                        <Field label="Warehouse" value={<NodeLink hash={t.warehouseId} />} />
                        <Field label="Bin" value={<NodeLink hash={t.sourceLocationId} />} />
                    </div>
                </div>
            )}
        />
    );
}
