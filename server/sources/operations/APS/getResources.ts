import { getDatasetForRequest } from "../utils";
import { APSreplyJSON, type APSOperationHandler } from "../../utils/openAPI";

export const getResources: APSOperationHandler<"getResources"> = async (_c, _req, res) => {
    const ds = getDatasetForRequest(_req);
    return APSreplyJSON({ data: ds.aps.resourceList }, res);
};
