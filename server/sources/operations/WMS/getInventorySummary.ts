import { getDatasetForRequest } from "../utils";
import { WMSreplyJSON, type WMSOperationHandler } from "../../utils/openAPI";

export const getInventorySummary: WMSOperationHandler<"getInventorySummary"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { warehouseId, itemId, asOf } = req.query as any;

    let summary: any[];

    if (asOf) {
        const asOfTs = Number(asOf);
        const totals = new Map<string, { itemId: string; warehouseId?: string; totalQuantityOnHand: number; uom: string }>();
        for (const mv of ds.wms.inventoryMovements) {
            if (mv.occurredAt > asOfTs) continue;
            const key = warehouseId ? `${mv.itemId}|${mv.warehouseId}` : mv.itemId;
            if (!totals.has(key)) {
                totals.set(key, { itemId: mv.itemId, ...(warehouseId ? { warehouseId: mv.warehouseId } : {}), totalQuantityOnHand: 0, uom: mv.uom });
            }
            totals.get(key)!.totalQuantityOnHand += mv.quantity;
        }
        summary = [...totals.values()].filter(s => s.totalQuantityOnHand > 0);
        if (warehouseId) summary = summary.filter(s => s.warehouseId === warehouseId);
        if (itemId)      summary = summary.filter(s => s.itemId      === itemId);
    } else {
        summary = ds.wms.inventorySummary;
        if (warehouseId) summary = summary.filter((s) => s.warehouseId === warehouseId);
        if (itemId)      summary = summary.filter((s) => s.itemId      === itemId);
    }

    return WMSreplyJSON({ data: summary }, res);
};
