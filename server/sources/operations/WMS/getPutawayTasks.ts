import { getDatasetForRequest } from "../utils";
import { WMSreplyJSON, type WMSOperationHandler } from "../../utils/openAPI";

export const getPutawayTasks: WMSOperationHandler<"getPutawayTasks"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { warehouseId, status, receiptId, fromDate, toDate } = req.query as any;

    let tasks = ds.wms.putawayTasks;
    if (warehouseId) tasks = tasks.filter((t) => t.warehouseId === warehouseId);
    if (status)      tasks = tasks.filter((t) => t.status      === status);
    if (receiptId)   tasks = tasks.filter((t) => t.receiptId   === receiptId);
    if (fromDate)    tasks = tasks.filter((t) => t.putawayDate >= Number(fromDate));
    if (toDate)      tasks = tasks.filter((t) => t.putawayDate <= Number(toDate));

    return WMSreplyJSON({ data: tasks }, res);
};
