import { getDatasetForRequest } from "../utils";
import { EAMreplyJSON, type EAMOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getWorkOrderById: EAMOperationHandler<"getWorkOrderById"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const id = req.params.workOrderId as string;
    const wo = ds.eam.workOrders.get(id);
    if (!wo) return notFound(id, res) as any;
    return EAMreplyJSON(wo, res);
};
