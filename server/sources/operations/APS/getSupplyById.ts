import { getDatasetForRequest } from "../utils";
import { APSreplyJSON, type APSOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getSupplyById: APSOperationHandler<"getSupplyById"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const id = req.params.supplyId as string;
    const supply = ds.aps.supplies.get(id);
    if (!supply) return notFound(id, res) as any;
    return APSreplyJSON({ data: supply }, res);
};
