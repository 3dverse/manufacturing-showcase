import { getDataset } from "../../generator/store";
import { WMSreplyJSON, type WMSOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getWarehouseById: WMSOperationHandler<"getWarehouseById"> = async (_c, req, res) => {
    const ds = getDataset();
    const id = req.params.warehouseId as string;
    const wh = ds.wms.warehouses.get(id);
    if (!wh) return notFound(id, res) as any;
    return WMSreplyJSON({ data: wh }, res);
};
