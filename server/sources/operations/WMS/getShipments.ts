import { getDataset } from "../../generator/store";
import { WMSreplyJSON, type WMSOperationHandler } from "../../utils/openAPI";
import { filterByDate } from "../utils";

export const getShipments: WMSOperationHandler<"getShipments"> = async (_c, req, res) => {
    const ds = getDataset();
    const { warehouseId, status, fromDate, toDate } = req.query as any;

    let shipments = ds.wms.shipments;
    if (warehouseId) shipments = shipments.filter((s) => s.warehouseId === warehouseId);
    if (status) shipments = shipments.filter((s) => s.status === status);
    shipments = filterByDate(shipments, fromDate, toDate, "shipDate");

    return WMSreplyJSON({ data: shipments }, res);
};
