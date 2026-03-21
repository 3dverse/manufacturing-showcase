import { getDataset } from "../../generator/store";
import { APSreplyJSON, type APSOperationHandler } from "../../utils/openAPI";

export const getSupplies: APSOperationHandler<"getSupplies"> = async (_c, _req, res) => {
    const ds = getDataset();
    return APSreplyJSON({ data: ds.aps.supplyList }, res);
};
