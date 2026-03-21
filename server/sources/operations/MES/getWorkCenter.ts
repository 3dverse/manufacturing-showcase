import { getDataset } from "../../generator/store";
import { MESreplyJSON, type MESOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";
import { seekWorkCenterStatus } from "./seekWorkCenterStatus";

export const getWorkCenter: MESOperationHandler<"getWorkCenter"> = async (_c, req, res) => {
    const ds = getDataset();
    const id = req.params.workCenterId as string;
    const wc = ds.mes.workCenters.get(id);
    if (!wc) return notFound(id, res) as any;

    const currentStatus = seekWorkCenterStatus(ds.mes.cellTimelines.get(id), ds.now);
    return MESreplyJSON({ data: { ...wc, status: currentStatus } }, res);
};
