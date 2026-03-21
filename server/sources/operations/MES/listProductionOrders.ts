import { getDataset } from "../../generator/store";
import { MESreplyJSON, type MESOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const listProductionOrders: MESOperationHandler<"listProductionOrders"> = async (_c, req, res) => {
    const ds = getDataset();
    const { siteId, status, workCenterId, itemCode, scheduledFrom, scheduledTo, page = "1", pageSize = "50" } = req.query as any;

    let pos = ds.mes.productionOrderList.map((id) => ds.mes.productionOrders.get(id)!);

    if (siteId) pos = pos.filter((po) => po.siteId === siteId);
    if (status) pos = pos.filter((po) => po.status === status);
    if (workCenterId) pos = pos.filter((po) => po.workCenterId === workCenterId);
    if (itemCode) pos = pos.filter((po) => po.itemCode === itemCode);
    if (scheduledFrom) {
        const from = new Date(scheduledFrom);
        pos = pos.filter((po) => new Date(po.timing.scheduledStart) >= from);
    }
    if (scheduledTo) {
        const to = new Date(scheduledTo);
        pos = pos.filter((po) => new Date(po.timing.scheduledStart) <= to);
    }

    return MESreplyJSON(paginate(pos, +page, +pageSize), res);
};
