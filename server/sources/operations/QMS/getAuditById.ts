import { getDataset } from "../../generator/store";
import { QMSreplyJSON, type QMSOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getAuditById: QMSOperationHandler<"getAuditById"> = async (_c, req, res) => {
    const ds = getDataset();
    const id = req.params.auditId as string;
    const audit = ds.qms.audits.get(id);
    if (!audit) return notFound(id, res) as any;
    return QMSreplyJSON(audit, res);
};
