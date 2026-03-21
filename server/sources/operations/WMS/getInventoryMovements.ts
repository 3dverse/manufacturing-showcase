import { getDataset } from "../../generator/store";
import { WMSreplyJSON } from "../../utils/openAPI";

export const getInventoryMovements = async (_c: any, req: any, res: any) => {
    const ds = getDataset();
    const { warehouseId, movementType, itemId, from, to } = req.query as any;

    let movements = ds.wms.inventoryMovements;
    if (warehouseId) movements = movements.filter((m) => m.warehouseId === warehouseId);
    if (movementType) movements = movements.filter((m) => m.movementType === movementType);
    if (itemId) movements = movements.filter((m) => m.itemId === itemId);
    if (from) movements = movements.filter((m) => m.occurredAt >= Number(from));
    if (to) movements = movements.filter((m) => m.occurredAt <= Number(to));

    return WMSreplyJSON({ data: movements }, res);
};
