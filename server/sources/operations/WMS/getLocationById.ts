import { getDataset } from "../../generator/store";
import { WMSreplyJSON, type WMSOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getLocationById: WMSOperationHandler<"getLocationById"> = async (_c, req, res) => {
    const ds = getDataset();
    const id = req.params.locationId as string;
    const loc = ds.wms.locations.get(id);
    if (!loc) return notFound(id, res) as any;
    return WMSreplyJSON({ data: loc }, res);
};
