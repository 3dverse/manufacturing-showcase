import { getDatasetForRequest } from "../utils";
import { APSreplyJSON, type APSOperationHandler } from "../../utils/openAPI";

export const getPlans: APSOperationHandler<"getPlans"> = async (_c, _req, res) => {
    const ds = getDatasetForRequest(_req);
    return APSreplyJSON({ data: ds.aps.planList }, res);
};
