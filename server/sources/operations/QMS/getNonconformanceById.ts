import { getDatasetForRequest } from "../utils";
import { QMSreplyJSON, type QMSOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getNonconformanceById: QMSOperationHandler<"getNonconformanceById"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const id = req.params.nonconformanceId as string;
    const nc = ds.qms.nonconformances.get(id);
    if (!nc) return notFound(id, res) as any;
    return QMSreplyJSON(nc, res);
};
