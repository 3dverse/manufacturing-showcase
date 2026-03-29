import { getDatasetForRequest } from "../utils";
import { WMSreplyJSON, type WMSOperationHandler } from "../../utils/openAPI";

export const getShipments: WMSOperationHandler<"getShipments"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { warehouseId, status, fromDate, toDate } = req.query as any;

    let shipments = ds.wms.shipments;
    if (warehouseId) shipments = shipments.filter((s) => s.warehouseId  === warehouseId);
    if (status)      shipments = shipments.filter((s) => s.status       === status);
    if (fromDate)    shipments = shipments.filter((s) => s.shippedDate  >= Number(fromDate));
    if (toDate)      shipments = shipments.filter((s) => s.shippedDate  <= Number(toDate));

    return WMSreplyJSON({ data: shipments }, res);
};
