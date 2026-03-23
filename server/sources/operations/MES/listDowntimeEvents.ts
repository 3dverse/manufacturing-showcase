import { getDatasetForRequest } from "../utils";
import { MESreplyJSON, type MESOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const listDowntimeEvents: MESOperationHandler<"listDowntimeEvents"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { siteId, workCenterId, reasonCode, startedFrom, startedTo, page = "1", pageSize = "50" } = req.query as any;

    let events = ds.mes.downtimeEvents;

    if (workCenterId) {
        events = ds.mes.downtimeByWorkCenter.get(workCenterId) ?? [];
    }

    if (siteId) events = events.filter((e) => e.siteId === siteId);
    if (reasonCode) events = events.filter((e) => e.reasonCode === reasonCode);
    if (startedFrom) {
        const from = Number(startedFrom);
        events = events.filter((e) => e.startedAt >= from);
    }
    if (startedTo) {
        const to = Number(startedTo);
        events = events.filter((e) => e.startedAt <= to);
    }

    return MESreplyJSON(paginate(events, +page, +pageSize), res);
};
