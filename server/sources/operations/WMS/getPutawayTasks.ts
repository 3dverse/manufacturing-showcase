import { getDataset } from "../../generator/store";
import { WMSreplyJSON, type WMSOperationHandler } from "../../utils/openAPI";
import { filterByDate } from "../utils";

export const getPutawayTasks: WMSOperationHandler<"getPutawayTasks"> = async (_c, req, res) => {
    const ds = getDataset();
    const { warehouseId, status, fromDate, toDate } = req.query as any;

    let tasks = ds.wms.putawayTasks;
    if (warehouseId) tasks = tasks.filter((t) => t.warehouseId === warehouseId);
    if (status) tasks = tasks.filter((t) => t.status === status);
    tasks = filterByDate(tasks, fromDate, toDate, "createdAt");

    return WMSreplyJSON({ data: tasks }, res);
};
