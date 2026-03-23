import { getDatasetForRequest } from "../utils";
import { APSreplyJSON, type APSOperationHandler } from "../../utils/openAPI";

export const getDemands: APSOperationHandler<"getDemands"> = async (_c, _req, res) => {
    const ds = getDatasetForRequest(_req);
    return APSreplyJSON({ data: ds.aps.demandList }, res);
};
