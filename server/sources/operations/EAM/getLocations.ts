import { getDatasetForRequest } from "../utils";
import { EAMreplyJSON, type EAMOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const getLocations: EAMOperationHandler<"getLocations"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { parentLocationId, siteCode, page = "1", pageSize = "50" } = req.query as any;

    let locs = ds.eam.locationList.map((id) => ds.eam.locations.get(id)!);

    if (parentLocationId) locs = locs.filter((l) => l.parentLocationId === parentLocationId);
    if (siteCode) locs = locs.filter((l) => l.siteCode === siteCode);

    return EAMreplyJSON(paginate(locs, +page, +pageSize), res);
};
