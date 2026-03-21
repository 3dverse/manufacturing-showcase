import { getDataset } from "../../generator/store";
import { QMSreplyJSON, type QMSOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const getDocuments: QMSOperationHandler<"getDocuments"> = async (_c, req, res) => {
    const ds = getDataset();
    const { documentType, status, department, effectiveFrom, effectiveTo, page = "1", pageSize = "50" } = req.query as any;

    let docs = ds.qms.documentList.map((id) => ds.qms.documents.get(id)!);

    if (documentType) docs = docs.filter((d) => d.documentType === documentType);
    if (status) docs = docs.filter((d) => d.status === status);
    if (department) docs = docs.filter((d) => d.department === department);
    if (effectiveFrom) docs = docs.filter((d) => d.effectiveAt >= effectiveFrom);
    if (effectiveTo) docs = docs.filter((d) => d.effectiveAt <= effectiveTo);

    return QMSreplyJSON(paginate(docs, +page, +pageSize), res);
};
