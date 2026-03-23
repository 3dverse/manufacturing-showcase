import { getDatasetForRequest } from "../utils";
import { EAMreplyJSON, type EAMOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const getInspections: EAMOperationHandler<"getInspections"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { assetId, locationId, result, inspectionFrom, inspectionTo, page = "1", pageSize = "50" } = req.query as any;

    let insps = ds.eam.inspectionList.map((id) => ds.eam.inspections.get(id)!);

    if (assetId) {
        const ids = new Set(ds.eam.inspectionsByAsset.get(assetId) ?? []);
        insps = insps.filter((i) => ids.has(i.id));
    }
    if (locationId) insps = insps.filter((i) => i.locationId === locationId);
    if (result) insps = insps.filter((i) => i.result === result);
    if (inspectionFrom) insps = insps.filter((i) => i.inspectionDate >= inspectionFrom);
    if (inspectionTo) insps = insps.filter((i) => i.inspectionDate <= inspectionTo + "T23:59:59Z");

    return EAMreplyJSON(paginate(insps, +page, +pageSize), res);
};
