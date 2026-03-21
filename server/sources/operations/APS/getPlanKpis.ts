import { getDataset } from "../../generator/store";
import { APSreplyJSON, type APSOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getPlanKpis: APSOperationHandler<"getPlanKpis"> = async (_c, req, res) => {
    const ds = getDataset();
    const id = req.params.planId as string;
    if (!ds.aps.plans.has(id)) return notFound(id, res) as any;
    const kpis = ds.aps.kpis.get(id) ?? [];
    return APSreplyJSON({ data: kpis }, res);
};
