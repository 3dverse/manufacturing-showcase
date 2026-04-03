import { getDatasetForRequest } from "../utils";
import { WMSreplyJSON, type WMSOperationHandler } from "../../utils/openAPI";

export const getInventory: WMSOperationHandler<"getInventory"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { warehouseId, locationId, itemId, lotNumber, serialNumber, handlingUnitId, asOf } = req.query as any;

    let positions: any[];

    if (asOf) {
        const asOfTs = Number(asOf);
        const balances = new Map<string, any>();
        for (const mv of ds.wms.inventoryMovements) {
            if (mv.occurredAt > asOfTs) continue;
            const key = `${mv.itemId}|${mv.locationId}`;
            if (!balances.has(key)) {
                balances.set(key, {
                    itemId: mv.itemId,
                    warehouseId: mv.warehouseId,
                    locationId: mv.locationId,
                    quantityOnHand: 0,
                    quantityAllocated: 0,
                    quantityAvailable: 0,
                    uom: mv.uom,
                    inventoryStatus: "available",
                });
            }
            balances.get(key).quantityOnHand += mv.quantity;
        }
        positions = [...balances.values()]
            .filter((p) => p.quantityOnHand > 0)
            .map((p) => ({ ...p, quantityAvailable: p.quantityOnHand }));
    } else if (itemId) {
        positions = ds.wms.inventoryByItem.get(itemId) ?? [];
    } else {
        positions = ds.wms.inventoryPositions;
    }

    if (warehouseId) positions = positions.filter((p) => p.warehouseId === warehouseId);
    if (locationId) positions = positions.filter((p) => p.locationId === locationId);
    if (lotNumber) positions = positions.filter((p) => p.lotNumber === lotNumber);
    if (serialNumber) positions = positions.filter((p) => p.serialNumber === serialNumber);
    if (handlingUnitId) positions = positions.filter((p) => p.handlingUnitId === handlingUnitId);
    if (asOf && itemId) positions = positions.filter((p) => p.itemId === itemId);

    return WMSreplyJSON({ data: positions }, res);
};
