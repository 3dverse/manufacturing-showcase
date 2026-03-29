import { getDatasetForRequest } from "../utils";
import { WMSreplyJSON, type WMSOperationHandler } from "../../utils/openAPI";

export const getPickTasks: WMSOperationHandler<"getPickTasks"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { warehouseId, shipmentId, status, fromDate, toDate } = req.query as any;

    let tasks = ds.wms.pickTasks;
    if (warehouseId) tasks = tasks.filter((t) => t.warehouseId === warehouseId);
    if (shipmentId)  tasks = tasks.filter((t) => t.shipmentId  === shipmentId);
    if (status)      tasks = tasks.filter((t) => t.status      === status);
    if (fromDate)    tasks = tasks.filter((t) => t.pickedDate  >= Number(fromDate));
    if (toDate)      tasks = tasks.filter((t) => t.pickedDate  <= Number(toDate));

    return WMSreplyJSON({ data: tasks }, res);
};
