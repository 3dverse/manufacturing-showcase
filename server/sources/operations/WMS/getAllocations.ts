import { getDatasetForRequest } from "../utils";
import { WMSreplyJSON, type WMSOperationHandler } from "../../utils/openAPI";

export const getAllocations: WMSOperationHandler<"getAllocations"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { warehouseId, itemId, productionOrderId, erpSalesOrderId } = req.query as any;

    let allocs = ds.wms.stockAllocations;
    if (warehouseId)       allocs = allocs.filter((a) => a.warehouseId       === warehouseId);
    if (itemId)            allocs = allocs.filter((a) => a.itemId            === itemId);
    if (productionOrderId) allocs = allocs.filter((a) => a.productionOrderId === productionOrderId);
    if (erpSalesOrderId)   allocs = allocs.filter((a) => a.erpSalesOrderId   === erpSalesOrderId);

    return WMSreplyJSON({ data: allocs }, res);
};
