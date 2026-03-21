import { getDataset } from "../../generator/store";
import { WMSreplyJSON, type WMSOperationHandler } from "../../utils/openAPI";

export const getLots: WMSOperationHandler<"getLots"> = async (_c, req, res) => {
    const ds = getDataset();
    const { warehouseId, itemId, lotNumber } = req.query as any;

    let lots = ds.wms.lotStock;
    if (warehouseId) lots = lots.filter((l) => l.warehouseId === warehouseId);
    if (itemId) lots = lots.filter((l) => l.itemId === itemId);
    if (lotNumber) lots = lots.filter((l) => l.lotNumber === lotNumber);

    return WMSreplyJSON({ data: lots }, res);
};
