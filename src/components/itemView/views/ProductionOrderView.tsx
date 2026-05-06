import { Field, StatusBadge, OverdueBadge, Divider } from "@/components/correlation/SectionWrapper";
import { ViewSection, MiniProgress } from "@/components/itemView/ViewSection";
import { NodeButton } from "@/components/common/NodeButton";
import { fmtTs } from "@/utils/helpers-time";
import type { ProjectedProductionOrder } from "@/core/Projection";
import type { ViewProps } from "@/components/itemView/ItemViewContent";

type Props = ViewProps<ProjectedProductionOrder>;

export function ProductionOrderView({ item, projection, correlated }: Props) {
    if (!item) return <p className="text-sm text-muted text-center py-6">Not in current scope.</p>;

    const salesOrder = correlated ? projection.salesOrders.find((so) => correlated.salesOrders.has(so.id)) : null;
    const operations = correlated ? projection.operations.filter((op) => correlated.operations.has(op.id)) : [];
    const allocations = correlated ? projection.allocations.filter((a) => correlated.allocations.has(a.id)) : [];

    const doneOps = operations.filter((op) => op.status === "completed").length;

    return (
        <div className="flex flex-col gap-4">
            <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                        <p className="text-base font-semibold">{item.orderNumber}</p>
                        <p className="text-xs text-muted">
                            {item.itemCode} · <NodeButton nodeId={item.locationId} />
                        </p>
                    </div>
                    <StatusBadge status={item.status} />
                </div>
                <Divider />
                <div className="space-y-1">
                    <Field
                        label="Status"
                        value={<span className="capitalize">{item.status.replace(/_/g, " ")}</span>}
                    />
                    <Field label="Scheduled Start" value={fmtTs(item.timing.scheduledStart)} />
                    <Field label="Scheduled End" value={fmtTs(item.timing.scheduledEnd)} />
                    {item.timing.actualStart != null && (
                        <Field label="Actual Start" value={fmtTs(item.timing.actualStart)} />
                    )}
                    {item.timing.actualEnd != null && <Field label="Actual End" value={fmtTs(item.timing.actualEnd)} />}
                </div>
            </div>

            <ViewSection title="Progress">
                <div className="space-y-1">
                    <MiniProgress pct={item.projected.progressPercent} />
                    <Field label="Planned" value={`${item.quantities.plannedQuantity} ${item.quantities.uom}`} />
                    <Field label="Produced" value={`${item.quantities.producedQuantity} ${item.quantities.uom}`} />
                    {item.quantities.goodQuantity != null && (
                        <Field label="Good" value={`${item.quantities.goodQuantity} ${item.quantities.uom}`} />
                    )}
                    {item.quantities.scrapQuantity != null && item.quantities.scrapQuantity > 0 && (
                        <Field label="Scrap" value={`${item.quantities.scrapQuantity} ${item.quantities.uom}`} />
                    )}
                </div>
            </ViewSection>

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

            {operations.length > 0 && (
                <ViewSection title={`Operations · ${doneOps}/${operations.length} done`}>
                    <div className="flex flex-col gap-2.5">
                        {operations.map((op) => (
                            <div key={op.id}>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-medium">{op.operationCode}</span>
                                    <StatusBadge status={op.status} />
                                </div>
                                <p className="text-[11px] text-muted mt-0.5">
                                    <NodeButton nodeId={op.workCenterId} /> · seq {op.sequence}
                                </p>
                                {op.status !== "planned" && <MiniProgress pct={op.projected.progressPercent} />}
                            </div>
                        ))}
                    </div>
                </ViewSection>
            )}

            {allocations.length > 0 && (
                <ViewSection title={`Raw Material Allocations · ${allocations.length}`}>
                    <div className="flex flex-col gap-1">
                        {allocations.map((a) => (
                            <Field
                                key={a.id}
                                label={a.itemId}
                                value={`${a.quantityAllocated}/${a.quantityRequired} ${a.uom}`}
                            />
                        ))}
                    </div>
                </ViewSection>
            )}
        </div>
    );
}
