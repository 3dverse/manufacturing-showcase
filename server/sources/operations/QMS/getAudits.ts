import { getDataset } from "../../generator/store";
import { QMSreplyJSON, type QMSOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const getAudits: QMSOperationHandler<"getAudits"> = async (_c, req, res) => {
    const ds = getDataset();
    const { status, auditType, scheduledFrom, scheduledTo, leadAuditor, page = "1", pageSize = "50" } = req.query as any;

    let audits = ds.qms.auditList.map((id) => ds.qms.audits.get(id)!);

    if (status) audits = audits.filter((a) => a.status === status);
    if (auditType) audits = audits.filter((a) => a.auditType === auditType);
    if (scheduledFrom) audits = audits.filter((a) => a.scheduledStart >= scheduledFrom);
    if (scheduledTo) audits = audits.filter((a) => a.scheduledStart <= scheduledTo);
    if (leadAuditor) audits = audits.filter((a) => a.leadAuditor === leadAuditor);

    return QMSreplyJSON(paginate(audits, +page, +pageSize), res);
};
