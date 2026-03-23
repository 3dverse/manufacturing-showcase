import { getDatasetForRequest } from "../utils";
import { MESreplyJSON, type MESOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getOperation: MESOperationHandler<"getOperation"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const id = req.params.operationId as string;
    const op = ds.mes.operations.get(id);
    if (!op) return notFound(id, res) as any;
    return MESreplyJSON({ data: op }, res);
};
