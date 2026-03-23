import { getDatasetForRequest } from "../utils";
import { MESreplyJSON, type MESOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const listProductionOrders: MESOperationHandler<"listProductionOrders"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { siteId, status, locationId, itemCode, scheduledFrom, scheduledTo, page = "1", pageSize = "50" } = req.query as any;

    let ids = locationId
        ? (ds.mes.productionOrdersByLocation.get(locationId) ?? [])
        : ds.mes.productionOrderList;

    let pos = ids.map((id) => ds.mes.productionOrders.get(id)!).filter(Boolean);

    if (siteId) pos = pos.filter((po) => po.siteId === siteId);
    if (status) pos = pos.filter((po) => po.status === status);
    if (itemCode) pos = pos.filter((po) => po.itemCode === itemCode);
    if (scheduledFrom) {
        const from = Number(scheduledFrom);
        pos = pos.filter((po) => po.timing.scheduledStart >= from);
    }
    if (scheduledTo) {
        const to = Number(scheduledTo);
        pos = pos.filter((po) => po.timing.scheduledStart <= to);
    }

    return MESreplyJSON(paginate(pos, +page, +pageSize), res);
};
