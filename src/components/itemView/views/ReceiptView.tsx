import { Field, StatusBadge, Divider } from "@/components/correlation/SectionWrapper";
import { ViewSection } from "@/components/itemView/ViewSection";
import { NodeButton } from "@/components/common/NodeButton";
import { fmtTs } from "@/utils/helpers-time";
import type { ProjectedReceipt } from "@/core/Projection";
import type { ViewProps } from "@/components/itemView/ItemViewContent";

type Props = ViewProps<ProjectedReceipt>;

export function ReceiptView({ item, projection, correlated }: Props) {
    if (!item) return <p className="text-sm text-muted text-center py-6">Not in current scope.</p>;

    const purchaseOrder = correlated
        ? projection.purchaseOrders.find((po) => correlated.purchaseOrders.has(po.id))
        : null;
    const putawayTasks = correlated ? projection.putawayTasks.filter((pt) => correlated.putawayTasks.has(pt.id)) : [];

    const donePutaway = putawayTasks.filter((pt) => pt.status === "completed").length;

    return (
        <div className="flex flex-col gap-4">
            <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                        <p className="text-base font-semibold">{item.id}</p>
                        <NodeButton nodeId={item.warehouseId} />
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
                    <Field label="Quantity" value={String(item.quantity)} />
                    <Field label="Received" value={fmtTs(item.receivedDate)} />
                    {item.projected.putawayDate != null && (
                        <Field label="Put Away" value={fmtTs(item.projected.putawayDate)} />
                    )}
                </div>
            </div>

            {purchaseOrder && (
                <ViewSection title="Purchase Order">
                    <div className="space-y-1">
                        <Field label="Order" value={purchaseOrder.orderNumber} />
                        <Field label="Supplier" value={purchaseOrder.supplierName ?? purchaseOrder.supplierId} />
                        <Field label="Ordered Qty" value={String(purchaseOrder.orderedQuantity)} />
                        {purchaseOrder.expectedDeliveryDate != null && (
                            <Field label="Expected Delivery" value={fmtTs(purchaseOrder.expectedDeliveryDate)} />
                        )}
                    </div>
                </ViewSection>
            )}

            {putawayTasks.length > 0 && (
                <ViewSection title={`Putaway Tasks · ${donePutaway}/${putawayTasks.length} done`}>
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
