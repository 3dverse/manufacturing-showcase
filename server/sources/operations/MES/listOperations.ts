import { getDataset } from "../../generator/store";
import { MESreplyJSON, type MESOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const listOperations: MESOperationHandler<"listOperations"> = async (_c, req, res) => {
    const ds = getDataset();
    const { productionOrderId, status, workCenterId, operationCode, page = "1", pageSize = "50" } = req.query as any;

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

    return MESreplyJSON(paginate(ops, +page, +pageSize), res);
};
