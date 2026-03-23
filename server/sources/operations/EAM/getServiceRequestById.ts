import { getDatasetForRequest } from "../utils";
import { EAMreplyJSON, type EAMOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getServiceRequestById: EAMOperationHandler<"getServiceRequestById"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const id = req.params.requestId as string;
    const sr = ds.eam.serviceRequests.get(id);
    if (!sr) return notFound(id, res) as any;
    return EAMreplyJSON(sr, res);
};
