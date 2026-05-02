import { SectionWrapper, Field, PartialBadge, Divider } from "@/components/correlation/SectionWrapper";
import { fmtTs } from "@/utils/helpers-time";
import type { ProjectedAllocation } from "@/core/Projection";

type Props = {
    items: ProjectedAllocation[];
    focusedId: string | null;
    focusedClassName?: string;
};

export function AllocationSheet({ items, focusedId, focusedClassName }: Props) {
    return (
        <SectionWrapper
            label="Allocations"
            items={items}
            focusedId={focusedId}
            focusedClassName={focusedClassName}
            getId={(e) => e.id}
            renderItem={(a) => (
                <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                            <p className="text-sm font-semibold leading-tight">{a.itemId}</p>
                            <p className="text-xs text-muted capitalize">{a.demandType.replace(/_/g, " ")}</p>
                        </div>
                        <div className="shrink-0 pt-px">{a.status === "partial" && <PartialBadge />}</div>
                    </div>
                    <Divider />
                    <div className="space-y-1">
                        <Field label="Allocated" value={`${a.quantityAllocated} / ${a.quantityRequired} ${a.uom}`} />
                        <Field label="Warehouse" value={a.warehouseId} />
                        <Field label="Location" value={a.locationId} />
                        <Field label="Since" value={fmtTs(a.allocatedAt)} />
                        {a.clearedAt && <Field label="Cleared" value={fmtTs(a.clearedAt)} />}
                    </div>
                </div>
            )}
        />
    );
}
