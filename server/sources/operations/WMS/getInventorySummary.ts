import { getDatasetForRequest } from "../utils";
import { WMSreplyJSON, type WMSOperationHandler } from "../../utils/openAPI";

export const getInventorySummary: WMSOperationHandler<"getInventorySummary"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { warehouseId, itemId, asOf } = req.query as any;

    let summary: any[];

    if (asOf) {
        const asOfTs = Number(asOf);
        const totals = new Map<string, { itemId: string; warehouseId: string; quantityOnHand: number; uom: string }>();
        for (const mv of ds.wms.inventoryMovements) {
            if (mv.occurredAt > asOfTs) continue;
            const key = `${mv.warehouseId}|${mv.itemId}`;
            if (!totals.has(key)) {
                totals.set(key, { itemId: mv.itemId, warehouseId: mv.warehouseId, quantityOnHand: 0, uom: mv.uom });
            }
            totals.get(key)!.quantityOnHand += mv.quantity;
        }
        summary = [...totals.values()]
            .filter((s) => s.quantityOnHand > 0)
            .map((s) => ({ ...s, quantityAllocated: 0, quantityAvailable: s.quantityOnHand }));
        if (warehouseId) summary = summary.filter((s) => s.warehouseId === warehouseId);
        if (itemId) summary = summary.filter((s) => s.itemId === itemId);
    } else {
        summary = ds.wms.inventorySummary;
        if (warehouseId) summary = summary.filter((s) => s.warehouseId === warehouseId);
        if (itemId) summary = summary.filter((s) => s.itemId === itemId);
    }

    return WMSreplyJSON({ data: summary }, res);
};
