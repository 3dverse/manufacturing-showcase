import { getDatasetForRequest } from "../utils";
import { EAMreplyJSON, type EAMOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const getMaintenancePlans: EAMOperationHandler<"getMaintenancePlans"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { status, assetId, planType, page = "1", pageSize = "50" } = req.query as any;

    let plans = ds.eam.maintenancePlanList.map((id) => ds.eam.maintenancePlans.get(id)!);

    if (status) plans = plans.filter((p) => p.status === status);
    if (assetId) {
        const ids = new Set(ds.eam.maintenancePlansByAsset.get(assetId) ?? []);
        plans = plans.filter((p) => ids.has(p.id));
    }
    if (planType) plans = plans.filter((p) => p.planType === planType);

    return EAMreplyJSON(paginate(plans, +page, +pageSize), res);
};
