import { getDatasetForRequest } from "../utils";
import { MESreplyJSON, type MESOperationHandler } from "../../utils/openAPI";

export const getPerformanceTimeseries: MESOperationHandler<"getPerformanceTimeseries"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { workCenterId, from: fromStr, to: toStr } = req.query as any;

    const nowTs = Math.floor(ds.now.getTime() / 1000);
    const from = fromStr ? Number(fromStr) : nowTs - 14 * 24 * 3600;
    const to = toStr ? Number(toStr) : nowTs;

    const buckets =
        ds.mes.oeeByWorkCenter.get(workCenterId)?.filter((b) => b.shiftStart >= from && b.shiftEnd <= to) ?? [];

    return MESreplyJSON({ data: buckets }, res);
};
