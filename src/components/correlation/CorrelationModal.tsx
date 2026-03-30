import { useMemo } from "react";
import { createPortal } from "react-dom";

import Modal from "@/components/common/modal/Modal";
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

import { useCorrelation } from "@/hooks/useCorrelation";
import { useSpanProjection } from "@/hooks/useSpanProjection";
import { useFocusStore } from "@/store/useFocusStore";
import type { FocusedEntity } from "@/core/Correlation";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

import type { AsOfProjection } from "@/core/Projection";

function getFocusedLabel(focused: FocusedEntity, projection: AsOfProjection): string {
    switch (focused.type) {
        case "salesOrder": {
            const e = projection.salesOrders.find((s) => s.id === focused.id);
            return `Sales Order${e ? ` — ${e.orderNumber}` : ""}`;
        }
        case "productionOrder": {
            const e = projection.productionOrders.find((p) => p.id === focused.id);
            return `Production Order${e ? ` — ${e.orderNumber}` : ""}`;
        }
        case "operation": {
            const e = projection.operations.find((o) => o.id === focused.id);
            return `Operation${e ? ` — ${e.operationCode}` : ""}`;
        }
        case "downtime": {
            const e = projection.downtimeEvents.find((d) => d.id === focused.id);
            return `Downtime${e ? ` — ${e.reasonCode}` : ""}`;
        }
        case "workOrder": {
            const e = projection.eamWorkOrders.find((w) => w.id === focused.id);
            return `Work Order${e ? ` — ${e.workOrderNumber}` : ""}`;
        }
        case "pickTask":
            return `Pick Task — ${focused.id}`;
        case "receipt":
            return `Receipt — ${focused.id}`;
        case "putawayTask":
            return `Putaway Task — ${focused.id}`;
        case "purchaseOrder": {
            const e = projection.purchaseOrders.find((p) => p.id === focused.id);
            return `Purchase Order${e ? ` — ${e.orderNumber}` : ""}`;
        }
        case "allocation":
            return `Allocation — ${focused.id}`;
    }
}

// ---------------------------------------------------------------------------
// CorrelationModal
// ---------------------------------------------------------------------------

export function CorrelationModal() {
    const { selected, setSelected } = useFocusStore();
    const projection = useSpanProjection();
    const correlated = useCorrelation(projection, selected);

    const title = useMemo(() => {
        if (!selected || !projection) return "";
        return getFocusedLabel(selected, projection);
    }, [selected, projection]);

    // Gather correlated items by filtering each projection array against the correlated ID sets
    const sections = useMemo(() => {
        if (!correlated || !projection) return null;
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

    if (!selected) return null;

    return createPortal(
        <Modal
            isOpen={true}
            onClose={() => setSelected(null)}
            title={title}
            contentClassName="w-full max-w-md"
            bodyClassName="overflow-y-auto max-h-[65vh]"
        >
            {/* key resets all section states (page, collapsed) when focused entity changes */}
            <div key={`${selected.type}-${selected.id}`} className="flex flex-col gap-2">
                {!sections && <p className="text-sm text-muted text-center py-6 animate-pulse">Loading…</p>}

                {sections && (
                    <>
                        {/* 1. Sales Orders */}
                        {sections.salesOrders.length > 0 && (
                            <SalesOrderSheet
                                items={sections.salesOrders}
                                focusedId={selected?.type === "salesOrder" ? selected.id : null}
                            />
                        )}

                        {/* 2. Purchase Orders */}
                        {sections.purchaseOrders.length > 0 && (
                            <PurchaseOrderSheet
                                items={sections.purchaseOrders}
                                focusedId={selected?.type === "purchaseOrder" ? selected.id : null}
                            />
                        )}

                        {/* 3. Production Orders */}
                        {sections.productionOrders.length > 0 && (
                            <ProductionOrderSheet
                                items={sections.productionOrders}
                                focusedId={selected?.type === "productionOrder" ? selected.id : null}
                            />
                        )}

                        {/* 4. Allocations */}
                        {sections.allocations.length > 0 && (
                            <AllocationSheet
                                items={sections.allocations}
                                focusedId={selected?.type === "allocation" ? selected.id : null}
                            />
                        )}

                        {/* 5. Operations */}
                        {sections.operations.length > 0 && (
                            <OperationSheet
                                items={sections.operations}
                                focusedId={selected?.type === "operation" ? selected.id : null}
                            />
                        )}

                        {/* 6. Downtime Events */}
                        {sections.downtimeEvents.length > 0 && (
                            <DowntimeSheet
                                items={sections.downtimeEvents}
                                focusedId={selected?.type === "downtime" ? selected.id : null}
                            />
                        )}

                        {/* 7. EAM Work Orders */}
                        {sections.eamWorkOrders.length > 0 && (
                            <WorkOrderSheet
                                items={sections.eamWorkOrders}
                                focusedId={selected?.type === "workOrder" ? selected.id : null}
                            />
                        )}

                        {/* 8. Pick Tasks */}
                        {sections.pickTasks.length > 0 && (
                            <PickTaskSheet
                                items={sections.pickTasks}
                                focusedId={selected?.type === "pickTask" ? selected.id : null}
                            />
                        )}

                        {/* 9. Receipts */}
                        {sections.receipts.length > 0 && (
                            <ReceiptSheet
                                items={sections.receipts}
                                focusedId={selected?.type === "receipt" ? selected.id : null}
                            />
                        )}

                        {/* 10. Putaway Tasks */}
                        {sections.putawayTasks.length > 0 && (
                            <PutawayTaskSheet
                                items={sections.putawayTasks}
                                focusedId={selected?.type === "putawayTask" ? selected.id : null}
                            />
                        )}
                    </>
                )}
            </div>
        </Modal>,
        document.body,
    );
}
