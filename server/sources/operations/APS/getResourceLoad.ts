import { getDataset } from "../../generator/store";
import { APSreplyJSON, type APSOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getResourceLoad: APSOperationHandler<"getResourceLoad"> = async (_c, req, res) => {
    const ds = getDataset();
    const id = req.params.resourceId as string;
    if (!ds.aps.resources.has(id)) return notFound(id, res) as any;
    const load = ds.aps.resourceLoad.get(id) ?? [];
    return APSreplyJSON({ data: load }, res);
};
