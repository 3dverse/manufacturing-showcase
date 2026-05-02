import { Field, PartialBadge, OverdueBadge, Divider } from "@/components/correlation/SectionWrapper";
import { ViewSection, MiniProgress } from "@/components/itemView/ViewSection";
import { NodeButton } from "@/components/common/NodeButton";
import { fmtTs } from "@/utils/helpers-time";
import type { ProjectedAllocation } from "@/core/Projection";
import type { ViewProps } from "@/components/itemView/ItemViewContent";

type Props = ViewProps<ProjectedAllocation>;

export function AllocationView({ item, projection, correlated }: Props) {
    if (!item) return <p className="text-sm text-muted text-center py-6">Not in current scope.</p>;

    const productionOrder = correlated
        ? projection.productionOrders.find((po) => correlated.productionOrders.has(po.id))
        : null;
    const salesOrder = correlated ? projection.salesOrders.find((so) => correlated.salesOrders.has(so.id)) : null;

    const fillPct =
        item.quantityRequired > 0 ? Math.round((item.quantityAllocated / item.quantityRequired) * 100) : 100;

    return (
        <div className="flex flex-col gap-4">
            <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                        <p className="text-base font-semibold">{item.id}</p>
                        <p className="text-xs text-muted capitalize">{item.demandType.replace(/_/g, " ")}</p>
                    </div>
                    {item.status === "partial" && <PartialBadge />}
                </div>
                <Divider />
                <div className="space-y-1">
                    <Field label="Item" value={item.itemId} />
                    <Field label="Warehouse" value={<NodeButton nodeId={item.warehouseId} />} />
                    <Field label="Location" value={item.locationId} />
                    <Field label="Allocated" value={`${item.quantityAllocated} ${item.uom}`} />
                    <Field label="Required" value={`${item.quantityRequired} ${item.uom}`} />
                    <MiniProgress pct={fillPct} />
                    <Field label="Allocated At" value={fmtTs(item.allocatedAt)} />
                    {item.clearedAt != null && <Field label="Cleared At" value={fmtTs(item.clearedAt)} />}
                </div>
            </div>

            {productionOrder && (
                <ViewSection title="Manufacturing Order">
                    <div className="space-y-1">
                        <Field label="Order" value={productionOrder.orderNumber} />
                        <Field label="Item" value={productionOrder.itemCode} />
                        <Field label="Location" value={<NodeButton nodeId={productionOrder.locationId} />} />
                        <MiniProgress pct={productionOrder.projected.progressPercent} />
                    </div>
                </ViewSection>
            )}

            {salesOrder && (
                <ViewSection title="Sales Order">
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
