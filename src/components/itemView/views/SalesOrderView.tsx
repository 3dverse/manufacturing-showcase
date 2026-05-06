import { Field, StatusBadge, OverdueBadge, Divider } from "@/components/correlation/SectionWrapper";
import { ViewSection, MiniProgress } from "@/components/itemView/ViewSection";
import { NodeButton } from "@/components/common/NodeButton";
import { fmtTs } from "@/utils/helpers-time";
import type { ProjectedSalesOrder } from "@/core/Projection";
import type { ViewProps } from "@/components/itemView/ItemViewContent";

type Props = ViewProps<ProjectedSalesOrder>;

export function SalesOrderView({ item, projection, correlated }: Props) {
    if (!item) return <p className="text-sm text-muted text-center py-6">Not in current scope.</p>;

    const productionOrders = correlated
        ? projection.productionOrders.filter((po) => correlated.productionOrders.has(po.id))
        : [];
    const pickTasks = correlated ? projection.pickTasks.filter((pt) => correlated.pickTasks.has(pt.id)) : [];
    const allocations = correlated ? projection.allocations.filter((a) => correlated.allocations.has(a.id)) : [];

    const donePickTasks = pickTasks.filter((pt) => pt.status === "completed").length;

    return (
        <div className="flex flex-col gap-4">
            <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                        <p className="text-base font-semibold">{item.orderNumber}</p>
                        <p className="text-xs text-muted">Customer {item.customerId}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 pt-px">
                        <StatusBadge status={item.status} />
                        {item.projected.isOverdue && <OverdueBadge />}
                    </div>
                </div>
                <Divider />
                <div className="space-y-1">
                    <Field
                        label="Status"
                        value={<span className="capitalize">{item.status.replace(/_/g, " ")}</span>}
                    />
                    <Field label="Order Date" value={fmtTs(item.orderDate)} />
                    <Field label="Requested Delivery" value={fmtTs(item.requestedDeliveryDate)} />
                    <Field label="Site" value={item.siteId} />
                </div>
            </div>

            {productionOrders.length > 0 && (
                <ViewSection title={`Manufacturing Orders · ${productionOrders.length}`}>
                    <div className="flex flex-col gap-3">
                        {productionOrders.map((po) => (
                            <div key={po.id}>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-medium">{po.orderNumber}</span>
                                    <StatusBadge status={po.status} />
                                </div>
                                <p className="text-[11px] text-muted mt-0.5">
                                    {po.itemCode} · <NodeButton nodeId={po.locationId} />
                                </p>
                                <MiniProgress pct={po.projected.progressPercent} />
                            </div>
                        ))}
                    </div>
                </ViewSection>
            )}

            {pickTasks.length > 0 && (
                <ViewSection title={`Pick Tasks · ${donePickTasks}/${pickTasks.length} done`}>
                    <div className="flex flex-col gap-2">
                        {pickTasks.map((pt) => (
                            <div key={pt.id} className="flex items-center justify-between gap-2">
                                <span className="text-xs text-muted">{pt.itemId}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs">
                                        {pt.quantity} {pt.uom}
                                    </span>
                                    <StatusBadge status={pt.status} />
                                </div>
                            </div>
                        ))}
                    </div>
                </ViewSection>
            )}

            {allocations.length > 0 && (
                <ViewSection title={`Allocations · ${allocations.length}`}>
                    <div className="flex flex-col gap-2">
                        {allocations.map((a) => (
                            <div key={a.id} className="flex items-center justify-between gap-2">
                                <span className="text-xs text-muted">{a.itemId}</span>
                                <span className="text-xs">
                                    {a.quantityAllocated}/{a.quantityRequired} {a.uom}
                                </span>
                            </div>
                        ))}
                    </div>
                </ViewSection>
            )}
        </div>
    );
}
