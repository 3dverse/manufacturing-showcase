import { getDataset } from "../../generator/store";
import { MESreplyJSON, type MESOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";
import { seekWorkCenterStatus } from "./seekWorkCenterStatus";

export const listWorkCenters: MESOperationHandler<"listWorkCenters"> = async (_c, req, res) => {
    const ds = getDataset();
    const { siteId, areaCode, status, page = "1", pageSize = "50" } = req.query as any;

    let wcs = ds.mes.workCenterList.map((id) => {
        const wc = ds.mes.workCenters.get(id)!;
        const currentStatus = seekWorkCenterStatus(ds.mes.cellTimelines.get(id), ds.now);
        return { ...wc, status: currentStatus };
    });

    if (siteId) wcs = wcs.filter((wc) => wc.siteId === siteId);
    if (areaCode) wcs = wcs.filter((wc) => wc.areaCode === areaCode);
    if (status) wcs = wcs.filter((wc) => wc.status === status);

    return MESreplyJSON(paginate(wcs, +page, +pageSize), res);
};
