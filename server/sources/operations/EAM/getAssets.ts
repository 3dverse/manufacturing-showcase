import { getDataset } from "../../generator/store";
import { EAMreplyJSON, type EAMOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const getAssets: EAMOperationHandler<"getAssets"> = async (_c, req, res) => {
    const ds = getDataset();
    const { status, assetType, locationId, criticality, parentAssetId, page = "1", pageSize = "50" } = req.query as any;

    let assets = ds.eam.assetList.map((id) => ds.eam.assets.get(id)!);

    if (status) assets = assets.filter((a) => a.status === status);
    if (assetType) assets = assets.filter((a) => a.assetType === assetType);
    if (locationId) assets = assets.filter((a) => a.locationId === locationId);
    if (criticality) assets = assets.filter((a) => a.criticality === criticality);
    if (parentAssetId) assets = assets.filter((a) => a.parentAssetId === parentAssetId);

    return EAMreplyJSON(paginate(assets, +page, +pageSize), res);
};
