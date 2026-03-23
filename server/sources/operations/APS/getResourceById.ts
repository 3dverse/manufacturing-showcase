import { getDatasetForRequest } from "../utils";
import { APSreplyJSON, type APSOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getResourceById: APSOperationHandler<"getResourceById"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const id = req.params.resourceId as string;
    const resource = ds.aps.resources.get(id);
    if (!resource) return notFound(id, res) as any;
    return APSreplyJSON({ data: resource }, res);
};
