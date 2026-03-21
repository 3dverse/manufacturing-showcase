import { getDataset } from "../../generator/store";
import { APSreplyJSON, type APSOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getSupplyById: APSOperationHandler<"getSupplyById"> = async (_c, req, res) => {
    const ds = getDataset();
    const id = req.params.supplyId as string;
    const supply = ds.aps.supplies.get(id);
    if (!supply) return notFound(id, res) as any;
    return APSreplyJSON({ data: supply }, res);
};
