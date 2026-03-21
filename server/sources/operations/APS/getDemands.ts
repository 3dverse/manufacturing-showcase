import { getDataset } from "../../generator/store";
import { APSreplyJSON, type APSOperationHandler } from "../../utils/openAPI";

export const getDemands: APSOperationHandler<"getDemands"> = async (_c, _req, res) => {
    const ds = getDataset();
    return APSreplyJSON({ data: ds.aps.demandList }, res);
};
