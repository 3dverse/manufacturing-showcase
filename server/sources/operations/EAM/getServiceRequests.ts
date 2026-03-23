import { getDatasetForRequest } from "../utils";
import { EAMreplyJSON, type EAMOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const getServiceRequests: EAMOperationHandler<"getServiceRequests"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { status, assetId, locationId, requestedFrom, requestedTo, page = "1", pageSize = "50" } = req.query as any;

    let srs = ds.eam.serviceRequestList.map((id) => ds.eam.serviceRequests.get(id)!);

    if (status) srs = srs.filter((sr) => sr.status === status);
    if (assetId) {
        const ids = new Set(ds.eam.serviceRequestsByAsset.get(assetId) ?? []);
        srs = srs.filter((sr) => ids.has(sr.id));
    }
    if (locationId) srs = srs.filter((sr) => sr.locationId === locationId);
    if (requestedFrom) srs = srs.filter((sr) => sr.requestedAt >= requestedFrom);
    if (requestedTo) srs = srs.filter((sr) => sr.requestedAt <= requestedTo + "T23:59:59Z");

    return EAMreplyJSON(paginate(srs, +page, +pageSize), res);
};
