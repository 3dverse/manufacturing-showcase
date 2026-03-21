import { getDataset } from "../../generator/store";
import { MESreplyJSON, type MESOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const listDowntimeEvents: MESOperationHandler<"listDowntimeEvents"> = async (_c, req, res) => {
    const ds = getDataset();
    const { siteId, workCenterId, reasonCode, startedFrom, startedTo, page = "1", pageSize = "50" } = req.query as any;

    let events = ds.mes.downtimeEvents;

    if (workCenterId) {
        events = ds.mes.downtimeByWorkCenter.get(workCenterId) ?? [];
    }

    if (siteId) events = events.filter((e) => e.siteId === siteId);
    if (reasonCode) events = events.filter((e) => e.reasonCode === reasonCode);
    if (startedFrom) {
        const from = new Date(startedFrom);
        events = events.filter((e) => new Date(e.startedAt) >= from);
    }
    if (startedTo) {
        const to = new Date(startedTo);
        events = events.filter((e) => new Date(e.startedAt) <= to);
    }

    return MESreplyJSON(paginate(events, +page, +pageSize), res);
};
