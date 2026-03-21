import { getDataset } from "../../generator/store";
import { QMSreplyJSON, type QMSOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getComplaintById: QMSOperationHandler<"getComplaintById"> = async (_c, req, res) => {
    const ds = getDataset();
    const id = req.params.complaintId as string;
    const comp = ds.qms.complaints.get(id);
    if (!comp) return notFound(id, res) as any;
    return QMSreplyJSON(comp, res);
};
