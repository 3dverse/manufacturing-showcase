import { getDatasetForRequest } from "../utils";
import { WMSreplyJSON, type WMSOperationHandler } from "../../utils/openAPI";

export const getInventorySummary: WMSOperationHandler<"getInventorySummary"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { warehouseId, itemId } = req.query as any;

    let summary = ds.wms.inventorySummary;
    if (warehouseId) summary = summary.filter((s) => s.warehouseId === warehouseId);
    if (itemId) summary = summary.filter((s) => s.itemId === itemId);

    return WMSreplyJSON({ data: summary }, res);
};
