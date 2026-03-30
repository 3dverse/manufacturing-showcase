import { SectionWrapper, Field, PhaseBadge, OverdueBadge, Divider } from "@/components/correlation/SectionWrapper";
import { fmtTs } from "@/components/timeline/timeUtils";
import type { ProjectedSalesOrder } from "@/core/Projection";

type Props = {
    items: ProjectedSalesOrder[];
    focusedId: string | null;
};

export function SalesOrderSheet({ items, focusedId }: Props) {
    return (
        <SectionWrapper
            label="Sales Orders"
            items={items}
            focusedId={focusedId}
            getId={(e) => e.id}
            renderItem={(so) => (
                <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                            <p className="text-sm font-semibold leading-tight">{so.orderNumber}</p>
                            <p className="text-xs text-muted">Customer {so.customerId}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 pt-px">
                            <PhaseBadge phase={so.phase} />
                            {so.isOverdue && <OverdueBadge />}
                        </div>
                    </div>
                    <Divider />
                    <div className="space-y-1">
                        <Field
                            label="Status"
                            value={<span className="capitalize">{so.status.replace(/_/g, " ")}</span>}
                        />
                        <Field label="Ordered" value={fmtTs(so.orderDate)} />
                        <Field label="Delivery" value={fmtTs(so.requestedDeliveryDate)} />
                        <Field label="Site" value={so.siteId} />
                    </div>
                </div>
            )}
        />
    );
}
