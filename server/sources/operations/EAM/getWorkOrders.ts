import { getDataset } from "../../generator/store";
import { EAMreplyJSON, type EAMOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const getWorkOrders: EAMOperationHandler<"getWorkOrders"> = async (_c, req, res) => {
    const ds = getDataset();
    const { status, assetId, locationId, priority, workType, scheduledFrom, scheduledTo, page = "1", pageSize = "50" } = req.query as any;

    let wos = ds.eam.workOrderList.map((id) => ds.eam.workOrders.get(id)!);

    if (status) wos = wos.filter((wo) => wo.status === status);
    if (assetId) {
        const ids = new Set(ds.eam.workOrdersByAsset.get(assetId) ?? []);
        wos = wos.filter((wo) => ids.has(wo.id));
    }
    if (locationId) {
        const ids = new Set(ds.eam.workOrdersByLocation.get(locationId) ?? []);
        wos = wos.filter((wo) => ids.has(wo.id));
    }
    if (priority) wos = wos.filter((wo) => wo.priority === priority);
    if (workType) wos = wos.filter((wo) => wo.workType === workType);
    if (scheduledFrom) wos = wos.filter((wo) => wo.scheduledStart >= scheduledFrom);
    if (scheduledTo) wos = wos.filter((wo) => wo.scheduledStart <= scheduledTo);

    return EAMreplyJSON(paginate(wos, +page, +pageSize), res);
};
