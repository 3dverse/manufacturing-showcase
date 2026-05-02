import { Field, StatusBadge, Divider } from "@/components/correlation/SectionWrapper";
import { ViewSection, MiniProgress } from "@/components/itemView/ViewSection";
import { NodeButton } from "@/components/common/NodeButton";
import { fmtTs } from "@/utils/helpers-time";
import type { ProjectedOperation } from "@/core/Projection";
import type { ViewProps } from "@/components/itemView/ItemViewContent";

type Props = ViewProps<ProjectedOperation>;

export function OperationView({ item, projection, correlated }: Props) {
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
                        <p className="text-base font-semibold">{item.operationCode}</p>
                        <p className="text-xs text-muted">
                            {item.operationDescription ?? "No description"} · seq {item.sequence}
                        </p>
                    </div>
                    <StatusBadge status={item.status} />
                </div>
                <Divider />
                <div className="space-y-1">
                    <Field label="Work Center" value={<NodeButton nodeId={item.workCenterId} />} />
                    <Field
                        label="Status"
                        value={<span className="capitalize">{item.status.replace(/_/g, " ")}</span>}
                    />
                    <Field label="Scheduled Start" value={fmtTs(item.scheduledStart)} />
                    <Field label="Scheduled End" value={fmtTs(item.scheduledEnd)} />
                    {item.actualStart != null && <Field label="Actual Start" value={fmtTs(item.actualStart)} />}
                    {item.actualEnd != null && <Field label="Actual End" value={fmtTs(item.actualEnd)} />}
                </div>
            </div>

            <ViewSection title="Progress">
                <div className="space-y-1">
                    <MiniProgress pct={item.projected.progressPercent} />
                    <Field label="Planned" value={`${item.quantities.plannedQuantity} ${item.quantities.uom}`} />
                    <Field label="Produced" value={`${item.quantities.producedQuantity} ${item.quantities.uom}`} />
                    <Field label="Good" value={`${item.quantities.goodQuantity} ${item.quantities.uom}`} />
                    {item.quantities.scrapQuantity > 0 && (
                        <Field label="Scrap" value={`${item.quantities.scrapQuantity} ${item.quantities.uom}`} />
                    )}
                    {item.plannedRunTimeMinutes != null && (
                        <Field label="Planned Runtime" value={`${item.plannedRunTimeMinutes} min`} />
                    )}
                    {item.actualRunTimeMinutes != null && (
                        <Field label="Actual Runtime" value={`${item.actualRunTimeMinutes} min`} />
                    )}
                </div>
            </ViewSection>

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
                    </div>
                </ViewSection>
            )}
        </div>
    );
}
