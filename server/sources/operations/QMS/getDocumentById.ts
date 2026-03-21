import { getDataset } from "../../generator/store";
import { QMSreplyJSON, type QMSOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getDocumentById: QMSOperationHandler<"getDocumentById"> = async (_c, req, res) => {
    const ds = getDataset();
    const id = req.params.documentId as string;
    const doc = ds.qms.documents.get(id);
    if (!doc) return notFound(id, res) as any;
    return QMSreplyJSON(doc, res);
};
