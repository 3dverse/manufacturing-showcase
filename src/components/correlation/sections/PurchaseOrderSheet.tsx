import { SectionWrapper, Field, PhaseBadge, Divider } from "@/components/correlation/SectionWrapper";
import { fmtTs } from "@/utils/helpers-time";
import type { ProjectedPurchaseOrder } from "@/core/Projection";

type Props = {
    items: ProjectedPurchaseOrder[];
    focusedId: string | null;
};

export function PurchaseOrderSheet({ items, focusedId }: Props) {
    return (
        <SectionWrapper
            label="Purchase Orders"
            items={items}
            focusedId={focusedId}
            getId={(e) => e.id}
            renderItem={(po) => (
                <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                            <p className="text-sm font-semibold leading-tight">{po.orderNumber}</p>
                            <p className="text-xs text-muted">{po.itemId}</p>
                        </div>
                        <div className="shrink-0 pt-px">
                            <PhaseBadge phase={po.phase} />
                        </div>
                    </div>
                    <Divider />
                    <div className="space-y-1">
                        <Field label="Supplier" value={po.supplierName ?? po.supplierId} />
                        <Field
                            label="Status"
                            value={<span className="capitalize">{po.status.replace(/_/g, " ")}</span>}
                        />
                        <Field label="Qty ordered" value={po.orderedQuantity} />
                        <Field label="Ordered" value={fmtTs(po.orderDate)} />
                        {po.expectedDeliveryDate && <Field label="Expected" value={fmtTs(po.expectedDeliveryDate)} />}
                        {po.receivedAt && <Field label="Received" value={fmtTs(po.receivedAt)} />}
                    </div>
                </div>
            )}
        />
    );
}
