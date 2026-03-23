import { getDatasetForRequest } from "../utils";
import { APSreplyJSON, type APSOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getDemandById: APSOperationHandler<"getDemandById"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const id = req.params.demandId as string;
    const demand = ds.aps.demands.get(id);
    if (!demand) return notFound(id, res) as any;
    return APSreplyJSON({ data: demand }, res);
};
