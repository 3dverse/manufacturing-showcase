import { getDatasetForRequest } from "../utils";
import { MESreplyJSON, type MESOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const listOperations: MESOperationHandler<"listOperations"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { productionOrderId, status, workCenterId, operationCode, scheduledFrom, scheduledTo, page = "1", pageSize = "50" } = req.query as any;

    let ops = ds.mes.operationList.map((id) => ds.mes.operations.get(id)!);

    if (productionOrderId) {
        const ids = ds.mes.operationsByProductionOrder.get(productionOrderId) ?? [];
        ops = ids.map((id) => ds.mes.operations.get(id)!).filter(Boolean);
    }
    if (status) ops = ops.filter((op) => op.status === status);
    if (workCenterId) {
        const ids = ds.mes.operationsByWorkCenter.get(workCenterId) ?? [];
        const idSet = new Set(ids);
        ops = ops.filter((op) => idSet.has(op.id));
    }
    if (operationCode) ops = ops.filter((op) => op.operationCode === operationCode);
    if (scheduledFrom) ops = ops.filter((op) => op.scheduledEnd   >= Number(scheduledFrom));
    if (scheduledTo)   ops = ops.filter((op) => op.scheduledStart <= Number(scheduledTo));

    return MESreplyJSON(paginate(ops, +page, +pageSize), res);
};
