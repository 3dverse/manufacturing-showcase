import { getDatasetForRequest } from "../utils";
import { EAMreplyJSON, type EAMOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getMaintenancePlanById: EAMOperationHandler<"getMaintenancePlanById"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const id = req.params.planId as string;
    const plan = ds.eam.maintenancePlans.get(id);
    if (!plan) return notFound(id, res) as any;
    return EAMreplyJSON(plan, res);
};
