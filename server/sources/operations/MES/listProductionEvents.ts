import { getDataset } from "../../generator/store";
import { MESreplyJSON, type MESOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const listProductionEvents: MESOperationHandler<"listProductionEvents"> = async (_c, req, res) => {
    const ds = getDataset();
    const { siteId, productionOrderId, operationId, workCenterId, eventType, occurredFrom, occurredTo, page = "1", pageSize = "50" } = req.query as any;

    let events = ds.mes.productionEvents;

    if (productionOrderId) {
        events = ds.mes.productionEventsByProductionOrder.get(productionOrderId) ?? [];
    } else if (operationId) {
        events = ds.mes.productionEventsByOperation.get(operationId) ?? [];
    } else if (workCenterId) {
        events = ds.mes.productionEventsByWorkCenter.get(workCenterId) ?? [];
    }

    if (siteId) events = events.filter((e) => e.siteId === siteId);
    if (eventType) events = events.filter((e) => e.eventType === eventType);
    if (occurredFrom) {
        const from = new Date(occurredFrom);
        events = events.filter((e) => new Date(e.occurredAt) >= from);
    }
    if (occurredTo) {
        const to = new Date(occurredTo);
        events = events.filter((e) => new Date(e.occurredAt) <= to);
    }

    return MESreplyJSON(paginate(events, +page, +pageSize), res);
};
