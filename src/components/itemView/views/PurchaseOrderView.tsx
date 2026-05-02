import { Field, StatusBadge, Divider } from "@/components/correlation/SectionWrapper";
import { ViewSection } from "@/components/itemView/ViewSection";
import { fmtTs } from "@/utils/helpers-time";
import type { ProjectedPurchaseOrder } from "@/core/Projection";
import type { ViewProps } from "@/components/itemView/ItemViewContent";

type Props = ViewProps<ProjectedPurchaseOrder>;

export function PurchaseOrderView({ item, projection, correlated }: Props) {
    if (!item) return <p className="text-sm text-muted text-center py-6">Not in current scope.</p>;

    const receipts = correlated ? projection.receipts.filter((r) => correlated.receipts.has(r.id)) : [];
    const putawayTasks = correlated ? projection.putawayTasks.filter((pt) => correlated.putawayTasks.has(pt.id)) : [];

    const totalReceived = receipts.reduce((sum, r) => sum + r.quantity, 0);
    const doneReceipts = receipts.filter((r) => r.status === "completed").length;

    return (
        <div className="flex flex-col gap-4">
            <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                        <p className="text-base font-semibold">{item.orderNumber}</p>
                        <p className="text-xs text-muted">{item.supplierName ?? item.supplierId}</p>
                    </div>
                    <StatusBadge status={item.status} />
                </div>
                <Divider />
                <div className="space-y-1">
                    <Field
                        label="Status"
                        value={<span className="capitalize">{item.status.replace(/_/g, " ")}</span>}
                    />
                    <Field label="Item" value={item.itemId} />
                    <Field label="Ordered Qty" value={String(item.orderedQuantity)} />
                    <Field label="Order Date" value={fmtTs(item.orderDate)} />
                    {item.expectedDeliveryDate != null && (
                        <Field label="Expected Delivery" value={fmtTs(item.expectedDeliveryDate)} />
                    )}
                    {item.receivedAt != null && <Field label="Received At" value={fmtTs(item.receivedAt)} />}
                </div>
            </div>

            {receipts.length > 0 && (
                <ViewSection title={`Receipts · ${doneReceipts}/${receipts.length} · ${totalReceived} units`}>
                    <div className="flex flex-col gap-2">
                        {receipts.map((r) => (
                            <div key={r.id} className="flex items-center justify-between gap-2">
                                <div>
                                    <span className="text-xs font-medium">{r.id}</span>
                                    <p className="text-[11px] text-muted">{fmtTs(r.receivedDate)}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs">{r.quantity}</span>
                                    <StatusBadge status={r.status} />
                                </div>
                            </div>
                        ))}
                    </div>
                </ViewSection>
            )}

            {putawayTasks.length > 0 && (
                <ViewSection
                    title={`Putaway Tasks · ${putawayTasks.filter((pt) => pt.status === "completed").length}/${putawayTasks.length} done`}
                >
                    <div className="flex flex-col gap-2">
                        {putawayTasks.map((pt) => (
                            <div key={pt.id} className="flex items-center justify-between gap-2">
                                <span className="text-xs text-muted">{pt.itemId}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs">{pt.quantity}</span>
                                    <StatusBadge status={pt.status} />
                                </div>
                            </div>
                        ))}
                    </div>
                </ViewSection>
            )}
        </div>
    );
}
