import { getDatasetForRequest } from "../utils";
import { WMSreplyJSON } from "../../utils/openAPI";

export const getInventoryMovements = async (_c: any, req: any, res: any) => {
    const ds = getDatasetForRequest(req);
    const { warehouseId, locationId, movementType, itemId, fromDate, toDate } = req.query as any;

    let movements = ds.wms.inventoryMovements;
    if (warehouseId) movements = movements.filter((m) => m.warehouseId === warehouseId);
    if (locationId) movements = movements.filter((m) => m.locationId === locationId);
    if (movementType) movements = movements.filter((m) => m.movementType === movementType);
    if (itemId) movements = movements.filter((m) => m.itemId === itemId);
    if (fromDate) movements = movements.filter((m) => m.occurredAt >= Number(fromDate));
    if (toDate) movements = movements.filter((m) => m.occurredAt <= Number(toDate));

    return WMSreplyJSON({ data: movements }, res);
};
