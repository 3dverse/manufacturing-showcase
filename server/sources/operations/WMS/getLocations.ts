import { getDataset } from "../../generator/store";
import { WMSreplyJSON, type WMSOperationHandler } from "../../utils/openAPI";

export const getLocations: WMSOperationHandler<"getLocations"> = async (_c, req, res) => {
    const ds = getDataset();
    const { warehouseId, zone, locationType, status } = req.query as any;

    let locs = ds.wms.locationList.map((id) => ds.wms.locations.get(id)!);

    if (warehouseId) locs = locs.filter((l) => l.warehouseId === warehouseId);
    if (zone) locs = locs.filter((l) => l.zone === zone);
    if (locationType) locs = locs.filter((l) => l.locationType === locationType);
    if (status) locs = locs.filter((l) => l.status === status);

    return WMSreplyJSON({ data: locs }, res);
};
