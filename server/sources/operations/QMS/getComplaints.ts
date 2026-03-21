import { getDataset } from "../../generator/store";
import { QMSreplyJSON, type QMSOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const getComplaints: QMSOperationHandler<"getComplaints"> = async (_c, req, res) => {
    const ds = getDataset();
    const { status, severity, receivedFrom, receivedTo, productCode, page = "1", pageSize = "50" } = req.query as any;

    let comps = ds.qms.complaintList.map((id) => ds.qms.complaints.get(id)!);

    if (status) comps = comps.filter((c) => c.status === status);
    if (severity) comps = comps.filter((c) => c.severity === severity);
    if (receivedFrom) comps = comps.filter((c) => c.receivedAt >= receivedFrom);
    if (receivedTo) comps = comps.filter((c) => c.receivedAt <= receivedTo);
    if (productCode) comps = comps.filter((c) => c.productCode === productCode);

    return QMSreplyJSON(paginate(comps, +page, +pageSize), res);
};
