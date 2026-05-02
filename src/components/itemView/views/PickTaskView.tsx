import { Field, StatusBadge, OverdueBadge, Divider } from "@/components/correlation/SectionWrapper";
import { ViewSection } from "@/components/itemView/ViewSection";
import { NodeButton } from "@/components/common/NodeButton";
import { fmtTs } from "@/utils/helpers-time";
import type { ProjectedPickTask } from "@/core/Projection";
import type { ViewProps } from "@/components/itemView/ItemViewContent";

type Props = ViewProps<ProjectedPickTask>;

export function PickTaskView({ item, projection, correlated }: Props) {
    if (!item) return <p className="text-sm text-muted text-center py-6">Not in current scope.</p>;

    const salesOrder = correlated ? projection.salesOrders.find((so) => correlated.salesOrders.has(so.id)) : null;

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
                    <Field label="Quantity" value={`${item.quantity} ${item.uom}`} />
                    {item.sourceLocationId && (
                        <Field label="Source" value={<NodeButton nodeId={item.sourceLocationId} />} />
                    )}
                    <Field label="Created" value={fmtTs(item.createdAt)} />
                    {item.startedAt != null && <Field label="Started" value={fmtTs(item.startedAt)} />}
                    {item.pickedDate != null && <Field label="Picked" value={fmtTs(item.pickedDate)} />}
                </div>
            </div>

            {salesOrder && (
                <ViewSection title="Fulfilling Sales Order">
                    <div className="space-y-1">
                        <Field label="Order" value={salesOrder.orderNumber} />
                        <Field label="Customer" value={salesOrder.customerId} />
                        <Field label="Delivery" value={fmtTs(salesOrder.requestedDeliveryDate)} />
                        {salesOrder.projected.isOverdue && (
                            <div className="pt-1">
                                <OverdueBadge />
                            </div>
                        )}
                    </div>
                </ViewSection>
            )}
        </div>
    );
}
