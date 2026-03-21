import { getDataset } from "../../generator/store";
import { APSreplyJSON, type APSOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getPlanCapacity: APSOperationHandler<"getPlanCapacity"> = async (_c, req, res) => {
    const ds = getDataset();
    const id = req.params.planId as string;
    if (!ds.aps.plans.has(id)) return notFound(id, res) as any;
    const buckets = ds.aps.capacityBucketsByPlan.get(id) ?? [];
    return APSreplyJSON({ data: buckets }, res);
};
