import { getDatasetForRequest } from "../utils";
import { APSreplyJSON, type APSOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getPlanMaterialAvailability: APSOperationHandler<"getPlanMaterialAvailability"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const id = req.params.planId as string;
    if (!ds.aps.plans.has(id)) return notFound(id, res) as any;
    const ma = ds.aps.materialAvailabilityByPlan.get(id) ?? [];
    return APSreplyJSON({ data: ma }, res);
};
