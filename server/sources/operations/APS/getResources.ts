import { getDataset } from "../../generator/store";
import { APSreplyJSON, type APSOperationHandler } from "../../utils/openAPI";

export const getResources: APSOperationHandler<"getResources"> = async (_c, _req, res) => {
    const ds = getDataset();
    return APSreplyJSON({ data: ds.aps.resourceList }, res);
};
