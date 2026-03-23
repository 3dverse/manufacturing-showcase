import { getDatasetForRequest } from "../utils";
import { EAMreplyJSON, type EAMOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getLocationById: EAMOperationHandler<"getLocationById"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const id = req.params.locationId as string;
    const loc = ds.eam.locations.get(id);
    if (!loc) return notFound(id, res) as any;
    return EAMreplyJSON(loc, res);
};
