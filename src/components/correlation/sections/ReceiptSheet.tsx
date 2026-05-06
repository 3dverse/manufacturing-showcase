import { SectionWrapper, Field, StatusBadge, Divider } from "@/components/correlation/SectionWrapper";
import { fmtTs } from "@/utils/helpers-time";
import type { ProjectedReceipt } from "@/core/Projection";

type Props = {
    items: ProjectedReceipt[];
    focusedId: string | null;
    focusedClassName?: string;
};

export function ReceiptSheet({ items, focusedId, focusedClassName }: Props) {
    return (
        <SectionWrapper
            label="Receipts"
            items={items}
            focusedId={focusedId}
            focusedClassName={focusedClassName}
            getId={(e) => e.id}
            renderItem={(r) => (
                <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                            <p className="text-sm font-semibold leading-tight font-mono">{r.id}</p>
                            <p className="text-xs text-muted">{r.itemId}</p>
                        </div>
                        <div className="shrink-0 pt-px">
                            <StatusBadge status={r.status} />
                        </div>
                    </div>
                    <Divider />
                    <div className="space-y-1">
                        <Field
                            label="Status"
                            value={<span className="capitalize">{r.status.replace(/_/g, " ")}</span>}
                        />
                        <Field label="Qty" value={r.quantity} />
                        <Field label="Received" value={fmtTs(r.receivedDate)} />
                        {r.projected.putawayDate && <Field label="Putaway" value={fmtTs(r.projected.putawayDate)} />}
                        <Field label="Warehouse" value={r.warehouseId} />
                    </div>
                </div>
            )}
        />
    );
}
