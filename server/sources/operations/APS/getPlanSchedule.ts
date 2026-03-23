import { getDatasetForRequest } from "../utils";
import { APSreplyJSON, type APSOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getPlanSchedule: APSOperationHandler<"getPlanSchedule"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const id = req.params.planId as string;
    if (!ds.aps.plans.has(id)) return notFound(id, res) as any;
    const ops = ds.aps.scheduledOperationsByPlan.get(id) ?? [];
    return APSreplyJSON({ data: ops }, res);
};
