import { getDatasetForRequest } from "../utils";
import { EAMreplyJSON, type EAMOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getAssetById: EAMOperationHandler<"getAssetById"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const id = req.params.assetId as string;
    const asset = ds.eam.assets.get(id);
    if (!asset) return notFound(id, res) as any;
    return EAMreplyJSON(asset, res);
};
