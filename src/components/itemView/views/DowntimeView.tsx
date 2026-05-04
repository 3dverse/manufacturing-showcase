import { Field, OngoingBadge, OverdueBadge, Divider } from "@/components/correlation/SectionWrapper";
import { ViewSection, MiniProgress } from "@/components/itemView/ViewSection";
import { NodeButton } from "@/components/common/NodeButton";
import { fmtTs, fmtDuration } from "@/utils/helpers-time";
import type { ProjectedDowntime } from "@/core/Projection";
import type { ViewProps } from "@/components/itemView/ItemViewContent";

type Props = ViewProps<ProjectedDowntime>;

export function DowntimeView({ item, projection, correlated }: Props) {
    if (!item) return <p className="text-sm text-muted text-center py-6">Not in current scope.</p>;

    const productionOrder = correlated
        ? projection.productionOrders.find((po) => correlated.productionOrders.has(po.id))
        : null;
    const salesOrder = correlated ? projection.salesOrders.find((so) => correlated.salesOrders.has(so.id)) : null;

    return (
        <div data-scenario="corrective-maintenance-step-4" className="flex flex-col gap-4">
            <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                        <p className="text-base font-semibold">{item.reasonCode}</p>
                        <p className="text-xs text-muted">{item.reasonDescription ?? "No description"}</p>
                    </div>
                    {item.projected.isOngoing && <OngoingBadge />}
                </div>
                <Divider />
                <div className="space-y-1">
                    <Field label="Work Center" value={<NodeButton nodeId={item.workCenterId} />} />
                    <Field label="Started" value={fmtTs(item.startedAt)} />
                    <Field label="Ended" value={item.endedAt ? fmtTs(item.endedAt) : null} />
                    <Field label="Duration" value={fmtDuration(item.projected.durationAtAsOf)} />
                </div>
            </div>

            {productionOrder && (
                <ViewSection title="Impacted Manufacturing Order">
                    <div className="space-y-1">
                        <Field label="Order" value={productionOrder.orderNumber} />
                        <Field label="Item" value={productionOrder.itemCode} />
                        <Field label="Location" value={productionOrder.locationId} />
                        <MiniProgress pct={productionOrder.projected.progressPercent} />
                    </div>
                </ViewSection>
            )}

            {salesOrder && (
                <ViewSection title="Customer Impact">
                    <div className="space-y-1">
                        <Field label="Order" value={salesOrder.orderNumber} />
                        <Field label="Customer" value={salesOrder.customerId} />
                        <Field label="Requested Delivery" value={fmtTs(salesOrder.requestedDeliveryDate)} />
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
