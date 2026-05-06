import { SalesOrderView } from "./views/SalesOrderView";
import { ProductionOrderView } from "./views/ProductionOrderView";
import { OperationView } from "./views/OperationView";
import { DowntimeView } from "./views/DowntimeView";
import { WorkOrderView } from "./views/WorkOrderView";
import { PickTaskView } from "./views/PickTaskView";
import { ReceiptView } from "./views/ReceiptView";
import { PutawayTaskView } from "./views/PutawayTaskView";
import { PurchaseOrderView } from "./views/PurchaseOrderView";
import { AllocationView } from "./views/AllocationView";

import type { FocusedEntity, CorrelatedSet } from "@/core/Correlation";
import type { AsOfProjection } from "@/core/Projection";

export type ViewProps<T> = {
    item: T | null;
    projection: AsOfProjection;
    correlated: CorrelatedSet | null;
};

type Props = {
    selected: FocusedEntity;
    projection: AsOfProjection | null;
    correlated: CorrelatedSet | null;
};

export function ItemViewContent({ selected, projection, correlated }: Props) {
    if (!projection) {
        return <p className="text-sm text-muted text-center py-6 animate-pulse">Loading…</p>;
    }

    const ctx = { projection, correlated };

    switch (selected.type) {
        case "salesOrder":
            return <SalesOrderView item={projection.salesOrders.find((e) => e.id === selected.id) ?? null} {...ctx} />;
        case "productionOrder":
            return (
                <ProductionOrderView
                    item={projection.productionOrders.find((e) => e.id === selected.id) ?? null}
                    {...ctx}
                />
            );
        case "operation":
            return <OperationView item={projection.operations.find((e) => e.id === selected.id) ?? null} {...ctx} />;
        case "downtime":
            return <DowntimeView item={projection.downtimeEvents.find((e) => e.id === selected.id) ?? null} {...ctx} />;
        case "workOrder":
            return <WorkOrderView item={projection.eamWorkOrders.find((e) => e.id === selected.id) ?? null} {...ctx} />;
        case "pickTask":
            return <PickTaskView item={projection.pickTasks.find((e) => e.id === selected.id) ?? null} {...ctx} />;
        case "receipt":
            return <ReceiptView item={projection.receipts.find((e) => e.id === selected.id) ?? null} {...ctx} />;
        case "putawayTask":
            return (
                <PutawayTaskView item={projection.putawayTasks.find((e) => e.id === selected.id) ?? null} {...ctx} />
            );
        case "purchaseOrder":
            return (
                <PurchaseOrderView
                    item={projection.purchaseOrders.find((e) => e.id === selected.id) ?? null}
                    {...ctx}
                />
            );
        case "allocation":
            return <AllocationView item={projection.allocations.find((e) => e.id === selected.id) ?? null} {...ctx} />;
    }
}
