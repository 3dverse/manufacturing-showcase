import { getDataset } from "../../generator/store";
import { WMSreplyJSON, type WMSOperationHandler } from "../../utils/openAPI";

export const getInventory: WMSOperationHandler<"getInventory"> = async (_c, req, res) => {
    const ds = getDataset();
    const { warehouseId, locationId, itemId, lotNumber, serialNumber, handlingUnitId } = req.query as any;

    let positions = ds.wms.inventoryPositions;

    if (itemId) {
        positions = ds.wms.inventoryByItem.get(itemId) ?? [];
    }
    if (warehouseId) positions = positions.filter((p) => p.warehouseId === warehouseId);
    if (locationId) positions = positions.filter((p) => p.locationId === locationId);
    if (lotNumber) positions = positions.filter((p) => p.lotNumber === lotNumber);
    if (serialNumber) positions = positions.filter((p) => p.serialNumber === serialNumber);
    if (handlingUnitId) positions = positions.filter((p) => p.handlingUnitId === handlingUnitId);

    return WMSreplyJSON({ data: positions }, res);
};
