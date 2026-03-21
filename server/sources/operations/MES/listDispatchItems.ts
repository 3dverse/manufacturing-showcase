import { getDataset } from "../../generator/store";
import { MESreplyJSON, type MESOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const listDispatchItems: MESOperationHandler<"listDispatchItems"> = async (_c, req, res) => {
    const ds = getDataset();
    const { siteId, workCenterId, productionOrderId, status, page = "1", pageSize = "50" } = req.query as any;

    let items = [...ds.mes.dispatchItems];

    if (siteId) items = items.filter((d) => d.siteId === siteId);
    if (workCenterId) items = items.filter((d) => d.workCenterId === workCenterId);
    if (productionOrderId) items = items.filter((d) => d.productionOrderId === productionOrderId);
    if (status) items = items.filter((d) => d.status === status);

    // Sort by priority
    items.sort((a, b) => a.dispatchPriority - b.dispatchPriority);

    return MESreplyJSON(paginate(items, +page, +pageSize), res);
};
