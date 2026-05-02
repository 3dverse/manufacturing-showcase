import { Field, StatusBadge, Divider } from "@/components/correlation/SectionWrapper";
import { ViewSection, MiniProgress } from "@/components/itemView/ViewSection";
import { NodeButton } from "@/components/common/NodeButton";
import { fmtTs } from "@/utils/helpers-time";
import type { ProjectedPutawayTask } from "@/core/Projection";
import type { ViewProps } from "@/components/itemView/ItemViewContent";

type Props = ViewProps<ProjectedPutawayTask>;

export function PutawayTaskView({ item, projection, correlated }: Props) {
    if (!item) return <p className="text-sm text-muted text-center py-6">Not in current scope.</p>;

    const receipt = correlated ? projection.receipts.find((r) => correlated.receipts.has(r.id)) : null;
    const purchaseOrder = correlated
        ? projection.purchaseOrders.find((po) => correlated.purchaseOrders.has(po.id))
        : null;

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
                    {item.sourceLocationId && (
                        <Field label="From" value={<NodeButton nodeId={item.sourceLocationId} />} />
                    )}
                    {item.destinationLocationId && (
                        <Field label="To" value={<NodeButton nodeId={item.destinationLocationId} />} />
                    )}
                    <Field label="Created" value={fmtTs(item.createdAt)} />
                    {item.startedAt != null && <Field label="Started" value={fmtTs(item.startedAt)} />}
                    {item.putawayDate != null && <Field label="Put Away" value={fmtTs(item.putawayDate)} />}
                </div>
                {item.status !== "completed" && (
                    <div className="mt-2">
                        <MiniProgress pct={item.projected.progressPercent} />
                    </div>
                )}
            </div>

            {receipt && (
                <ViewSection title="Source Receipt">
                    <div className="space-y-1">
                        <Field label="Receipt" value={receipt.id} />
                        <Field label="Warehouse" value={<NodeButton nodeId={receipt.warehouseId} />} />
                        <Field label="Item" value={receipt.itemId} />
                        <Field label="Quantity" value={String(receipt.quantity)} />
                        <Field label="Received" value={fmtTs(receipt.receivedDate)} />
                    </div>
                </ViewSection>
            )}

            {purchaseOrder && (
                <ViewSection title="Purchase Order">
                    <div className="space-y-1">
                        <Field label="Order" value={purchaseOrder.orderNumber} />
                        <Field label="Supplier" value={purchaseOrder.supplierName ?? purchaseOrder.supplierId} />
                        <Field label="Ordered Qty" value={String(purchaseOrder.orderedQuantity)} />
                    </div>
                </ViewSection>
            )}
        </div>
    );
}
