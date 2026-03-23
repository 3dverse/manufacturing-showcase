import { getDatasetForRequest } from "../utils";
import { WMSreplyJSON, type WMSOperationHandler } from "../../utils/openAPI";

export const getWarehouses: WMSOperationHandler<"getWarehouses"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { warehouseCode, status } = req.query as any;

    let whs = [...ds.wms.warehouses.values()];
    if (warehouseCode) whs = whs.filter((w) => w.code === warehouseCode);
    if (status) whs = whs.filter((w) => w.status === status);

    return WMSreplyJSON({ data: whs }, res);
};
