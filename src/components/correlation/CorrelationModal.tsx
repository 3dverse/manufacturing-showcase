import { useMemo } from "react";

import { SalesOrderSheet } from "@/components/correlation/sections/SalesOrderSheet";
import { PurchaseOrderSheet } from "@/components/correlation/sections/PurchaseOrderSheet";
import { ProductionOrderSheet } from "@/components/correlation/sections/ProductionOrderSheet";
import { AllocationSheet } from "@/components/correlation/sections/AllocationSheet";
import { OperationSheet } from "@/components/correlation/sections/OperationSheet";
import { DowntimeSheet } from "@/components/correlation/sections/DowntimeSheet";
import { WorkOrderSheet } from "@/components/correlation/sections/WorkOrderSheet";
import { PickTaskSheet } from "@/components/correlation/sections/PickTaskSheet";
import { ReceiptSheet } from "@/components/correlation/sections/ReceiptSheet";
import { PutawayTaskSheet } from "@/components/correlation/sections/PutawayTaskSheet";

import { ENTITY_COLORS } from "@/content/entityColors";
import type { FocusedEntity, CorrelatedSet } from "@/core/Correlation";
import type { AsOfProjection } from "@/core/Projection";

// ---------------------------------------------------------------------------
type Props = {
    selected: FocusedEntity;
    projection: AsOfProjection;
    correlated: CorrelatedSet | null;
};

export function CorrelationTabContent({ selected, projection, correlated }: Props) {
    const focusedClassName = ENTITY_COLORS[selected.type].focusedBorder;

    const sections = useMemo(() => {
        if (!correlated) return null;
        return {
            salesOrders: projection.salesOrders.filter((e) => correlated.salesOrders.has(e.id)),
            purchaseOrders: projection.purchaseOrders.filter((e) => correlated.purchaseOrders.has(e.id)),
            productionOrders: projection.productionOrders.filter((e) => correlated.productionOrders.has(e.id)),
            allocations: projection.allocations.filter((e) => correlated.allocations.has(e.id)),
            operations: projection.operations.filter((e) => correlated.operations.has(e.id)),
            downtimeEvents: projection.downtimeEvents.filter((e) => correlated.downtimeEvents.has(e.id)),
            eamWorkOrders: projection.eamWorkOrders.filter((e) => correlated.eamWorkOrders.has(e.id)),
            pickTasks: projection.pickTasks.filter((e) => correlated.pickTasks.has(e.id)),
            receipts: projection.receipts.filter((e) => correlated.receipts.has(e.id)),
            putawayTasks: projection.putawayTasks.filter((e) => correlated.putawayTasks.has(e.id)),
        };
    }, [correlated, projection]);

    if (!sections) return <p className="text-sm text-muted text-center py-6 animate-pulse">Loading…</p>;

    return (
        <>
            {sections.salesOrders.length > 0 && (
                <SalesOrderSheet
                    items={sections.salesOrders}
                    focusedId={selected.type === "salesOrder" ? selected.id : null}
                    focusedClassName={focusedClassName}
                />
            )}
            {sections.purchaseOrders.length > 0 && (
                <PurchaseOrderSheet
                    items={sections.purchaseOrders}
                    focusedId={selected.type === "purchaseOrder" ? selected.id : null}
                    focusedClassName={focusedClassName}
                />
            )}
            {sections.productionOrders.length > 0 && (
                <ProductionOrderSheet
                    items={sections.productionOrders}
                    focusedId={selected.type === "productionOrder" ? selected.id : null}
                    focusedClassName={focusedClassName}
                />
            )}
            {sections.allocations.length > 0 && (
                <AllocationSheet
                    items={sections.allocations}
                    focusedId={selected.type === "allocation" ? selected.id : null}
                    focusedClassName={focusedClassName}
                />
            )}
            {sections.operations.length > 0 && (
                <OperationSheet
                    items={sections.operations}
                    focusedId={selected.type === "operation" ? selected.id : null}
                    focusedClassName={focusedClassName}
                />
            )}
            {sections.downtimeEvents.length > 0 && (
                <DowntimeSheet
                    items={sections.downtimeEvents}
                    focusedId={selected.type === "downtime" ? selected.id : null}
                    focusedClassName={focusedClassName}
                />
            )}
            {sections.eamWorkOrders.length > 0 && (
                <WorkOrderSheet
                    items={sections.eamWorkOrders}
                    focusedId={selected.type === "workOrder" ? selected.id : null}
                    focusedClassName={focusedClassName}
                />
            )}
            {sections.pickTasks.length > 0 && (
                <PickTaskSheet
                    items={sections.pickTasks}
                    focusedId={selected.type === "pickTask" ? selected.id : null}
                    focusedClassName={focusedClassName}
                />
            )}
            {sections.receipts.length > 0 && (
                <ReceiptSheet
                    items={sections.receipts}
                    focusedId={selected.type === "receipt" ? selected.id : null}
                    focusedClassName={focusedClassName}
                />
            )}
            {sections.putawayTasks.length > 0 && (
                <PutawayTaskSheet
                    items={sections.putawayTasks}
                    focusedId={selected.type === "putawayTask" ? selected.id : null}
                    focusedClassName={focusedClassName}
                />
            )}
        </>
    );
}
