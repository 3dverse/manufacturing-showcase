import { getDataset } from "../../generator/store";
import { EAMreplyJSON, type EAMOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getAssetHistory: EAMOperationHandler<"getAssetHistory"> = async (_c, req, res) => {
    const ds = getDataset();
    const id = req.params.assetId as string;
    if (!ds.eam.assets.has(id)) return notFound(id, res) as any;
    const { fromDate, toDate } = req.query as any;

    let events = ds.eam.assetHistory.get(id) ?? [];
    if (fromDate) events = events.filter((e) => e.eventDate >= fromDate);
    if (toDate) events = events.filter((e) => e.eventDate <= toDate + "T23:59:59Z");

    return EAMreplyJSON({ assetId: id, events }, res);
};
