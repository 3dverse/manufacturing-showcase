import { getDatasetForRequest } from "../utils";
import { WMSreplyJSON, type WMSOperationHandler } from "../../utils/openAPI";
import { filterByDate } from "../utils";

export const getCycleCounts: WMSOperationHandler<"getCycleCounts"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { warehouseId, status, fromDate, toDate } = req.query as any;

    let counts = ds.wms.cycleCounts;
    if (warehouseId) counts = counts.filter((c) => c.warehouseId === warehouseId);
    if (status) counts = counts.filter((c) => c.status === status);
    counts = filterByDate(counts, fromDate, toDate, "scheduledDate");

    return WMSreplyJSON({ data: counts }, res);
};
