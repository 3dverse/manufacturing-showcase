import { getDataset } from "../../generator/store";
import { ERPreplyJSON, type ERPOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getPurchaseOrderById: ERPOperationHandler<"getPurchaseOrderById"> = async (_c, req, res) => {
    const ds = getDataset();
    const id = req.params.purchaseOrderId as string;
    const po = ds.erp.purchaseOrders.get(id);
    if (!po) return notFound(id, res) as any;
    return ERPreplyJSON({ data: po }, res);
};
