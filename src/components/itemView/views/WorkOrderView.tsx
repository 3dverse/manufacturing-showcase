import { Field, StatusBadge, OverdueBadge, Divider } from "@/components/correlation/SectionWrapper";
import { ViewSection, MiniProgress } from "@/components/itemView/ViewSection";
import { NodeButton } from "@/components/common/NodeButton";
import { fmtTs } from "@/utils/helpers-time";
import type { ProjectedWorkOrder } from "@/core/Projection";
import type { ViewProps } from "@/components/itemView/ItemViewContent";

type Props = ViewProps<ProjectedWorkOrder>;

export function WorkOrderView({ item, projection, correlated }: Props) {
    if (!item) return <p className="text-sm text-muted text-center py-6">Not in current scope.</p>;

    const productionOrder = correlated
        ? projection.productionOrders.find((po) => correlated.productionOrders.has(po.id))
        : null;
    const salesOrder = correlated ? projection.salesOrders.find((so) => correlated.salesOrders.has(so.id)) : null;

    return (
        <div className="flex flex-col gap-4">
            <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                        <p className="text-base font-semibold">{item.workOrderNumber}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 pt-px">
                        <StatusBadge status={item.status} />
                        {item.projected.isOverdue && <OverdueBadge />}
                    </div>
                </div>
                <Divider />
                <div className="space-y-1">
                    <Field
                        label="Type"
                        value={<span className="capitalize">{item.workType.replace(/_/g, " ")}</span>}
                    />
                    <Field
                        label="Status"
                        value={<span className="capitalize">{item.status.replace(/_/g, " ")}</span>}
                    />
                    <Field label="Asset" value={<NodeButton nodeId={item.assetId} />} />
                    {item.locationId && <Field label="Location" value={<NodeButton nodeId={item.locationId} />} />}
                    <Field label="Scheduled Start" value={fmtTs(item.actualStart ?? item.scheduledStart)} />
                    <Field label="Scheduled End" value={fmtTs(item.actualEnd ?? item.scheduledEnd)} />
                    {item.actualStart != null && <Field label="Actual Start" value={fmtTs(item.actualStart)} />}
                    {item.actualEnd != null && <Field label="Actual End" value={fmtTs(item.actualEnd)} />}
                </div>
            </div>

            {productionOrder && (
                <ViewSection title="Related Manufacturing Order">
                    <div className="space-y-1">
                        <Field label="Order" value={productionOrder.orderNumber} />
                        <Field label="Item" value={productionOrder.itemCode} />
                        <Field label="Location" value={productionOrder.locationId} />
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
