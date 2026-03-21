import { getDataset } from "../../generator/store";
import { APSreplyJSON, type APSOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getPlanById: APSOperationHandler<"getPlanById"> = async (_c, req, res) => {
    const ds = getDataset();
    const id = req.params.planId as string;
    const plan = ds.aps.plans.get(id);
    if (!plan) return notFound(id, res) as any;
    return APSreplyJSON({ data: plan }, res);
};
