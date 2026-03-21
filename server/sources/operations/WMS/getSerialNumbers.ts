import { getDataset } from "../../generator/store";
import { WMSreplyJSON, type WMSOperationHandler } from "../../utils/openAPI";

export const getSerialNumbers: WMSOperationHandler<"getSerialNumbers"> = async (_c, req, res) => {
    const ds = getDataset();
    const { warehouseId, itemId, serialNumber } = req.query as any;

    let serials = ds.wms.serialStock;
    if (warehouseId) serials = serials.filter((s) => s.warehouseId === warehouseId);
    if (itemId) serials = serials.filter((s) => s.itemId === itemId);
    if (serialNumber) serials = serials.filter((s) => s.serialNumber === serialNumber);

    return WMSreplyJSON({ data: serials }, res);
};
