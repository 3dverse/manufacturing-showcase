import { getDataset } from "../../generator/store";
import { EAMreplyJSON, type EAMOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getWorkOrderOperations: EAMOperationHandler<"getWorkOrderOperations"> = async (_c, req, res) => {
    const ds = getDataset();
    const id = req.params.workOrderId as string;
    if (!ds.eam.workOrders.has(id)) return notFound(id, res) as any;
    const ops = ds.eam.workOrderOperations.get(id) ?? [];
    return EAMreplyJSON({ workOrderId: id, operations: ops }, res);
};
