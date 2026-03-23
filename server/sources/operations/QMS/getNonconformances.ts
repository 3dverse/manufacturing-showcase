import { getDatasetForRequest } from "../utils";
import { QMSreplyJSON, type QMSOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const getNonconformances: QMSOperationHandler<"getNonconformances"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { status, severity, sourceType, itemCode, detectedFrom, detectedTo, page = "1", pageSize = "50" } = req.query as any;

    let ncs = ds.qms.nonconformanceList.map((id) => ds.qms.nonconformances.get(id)!);

    if (status) ncs = ncs.filter((nc) => nc.status === status);
    if (severity) ncs = ncs.filter((nc) => nc.severity === severity);
    if (sourceType) ncs = ncs.filter((nc) => nc.sourceType === sourceType);
    if (itemCode) ncs = ncs.filter((nc) => nc.itemCode === itemCode);
    if (detectedFrom) ncs = ncs.filter((nc) => nc.detectedAt >= detectedFrom);
    if (detectedTo) ncs = ncs.filter((nc) => nc.detectedAt <= detectedTo);

    return QMSreplyJSON(paginate(ncs, +page, +pageSize), res);
};
