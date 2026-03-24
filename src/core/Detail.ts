import { MES } from "@/core/APIs";
import type { ProductionOrderDetailEntry, OperationEntry } from "@/core/Scope";
import type { ProductionOrderDetail } from "_prebuild/api-libs/mes";
import type { OperationDetail } from "_prebuild/api-libs/mes";

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapPODetail(po: ProductionOrderDetail): ProductionOrderDetailEntry {
    const t = po.timing;
    const q = po.quantities;
    return {
        id:                 po.id,
        orderNumber:        po.orderNumber,
        locationId:         po.locationId ?? "",
        itemCode:           po.itemCode,
        status:             po.status,
        timing: {
            scheduledStart: Number(t.scheduledStart ?? 0),
            scheduledEnd:   Number(t.scheduledEnd   ?? 0),
            actualStart:    t.actualStart ? Number(t.actualStart) : undefined,
            actualEnd:      t.actualEnd   ? Number(t.actualEnd)   : undefined,
        },
        quantities: {
            plannedQuantity:  q.plannedQuantity,
            producedQuantity: q.producedQuantity,
            goodQuantity:     q.goodQuantity,
            scrapQuantity:    q.scrapQuantity,
            uom:              q.uom,
        },
        erpSalesOrderId:    po.erpSalesOrderId ?? null,
        progressPercent:    po.progressPercent,
        operationIds:       po.operationIds,
        currentOperationId: po.currentOperationId ?? null,
        notes:              po.notes,
    };
}

function mapOpDetail(op: OperationDetail): OperationEntry {
    return {
        id:                   op.id,
        productionOrderId:    op.productionOrderId,
        workCenterId:         op.workCenterId,
        operationCode:        op.operationCode,
        operationDescription: op.operationDescription,
        sequence:             op.sequence,
        status:               op.status,
        scheduledStart:       Number(op.scheduledStart ?? 0),
        scheduledEnd:         Number(op.scheduledEnd   ?? 0),
        actualStart:          op.actualStart ? Number(op.actualStart) : undefined,
        actualEnd:            op.actualEnd   ? Number(op.actualEnd)   : undefined,
        progressPercent:      op.progressPercent,
        quantities: {
            plannedQuantity:  op.quantities.plannedQuantity,
            producedQuantity: op.quantities.producedQuantity,
            goodQuantity:     op.quantities.goodQuantity,
            scrapQuantity:    op.quantities.scrapQuantity,
            uom:              op.quantities.uom,
        },
        plannedRunTimeMinutes: op.plannedRunTimeMinutes,
        actualRunTimeMinutes:  op.actualRunTimeMinutes,
    };
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

export async function fetchPODetail(id: string, siteId: string): Promise<ProductionOrderDetailEntry> {
    const r = await MES.getProductionOrder({ productionOrderId: id, siteId });
    return mapPODetail(r.data.data);
}

export async function fetchOpDetail(id: string, siteId: string): Promise<OperationEntry> {
    const r = await MES.getOperation({ operationId: id, siteId });
    return mapOpDetail(r.data.data);
}
