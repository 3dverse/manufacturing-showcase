import { getDataset } from "../../generator/store";
import { WMSreplyJSON, type WMSOperationHandler } from "../../utils/openAPI";

export const getHandlingUnits: WMSOperationHandler<"getHandlingUnits"> = async (_c, req, res) => {
    const ds = getDataset();
    const { warehouseId, handlingUnitId, locationId, status } = req.query as any;

    let hus = ds.wms.handlingUnits;
    if (warehouseId) hus = hus.filter((h) => h.warehouseId === warehouseId);
    if (handlingUnitId) hus = hus.filter((h) => h.id === handlingUnitId);
    if (locationId) hus = hus.filter((h) => h.locationId === locationId);
    if (status) hus = hus.filter((h) => h.status === status);

    return WMSreplyJSON({ data: hus }, res);
};
