import { getDataset } from "../../generator/store";
import { ERPreplyJSON, type ERPOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getSalesOrderById: ERPOperationHandler<"getSalesOrderById"> = async (_c, req, res) => {
    const ds = getDataset();
    const id = req.params.salesOrderId as string;
    const so = ds.erp.salesOrders.get(id);
    if (!so) return notFound(id, res) as any;
    return ERPreplyJSON({ data: so }, res);
};
