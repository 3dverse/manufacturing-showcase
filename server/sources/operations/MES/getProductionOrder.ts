import { getDatasetForRequest } from "../utils";
import { MESreplyJSON, type MESOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getProductionOrder: MESOperationHandler<"getProductionOrder"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const id = req.params.productionOrderId as string;
    const po = ds.mes.productionOrders.get(id);
    if (!po) return notFound(id, res) as any;
    return MESreplyJSON({ data: po }, res);
};
