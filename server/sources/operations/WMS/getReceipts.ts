import { getDataset } from "../../generator/store";
import { WMSreplyJSON, type WMSOperationHandler } from "../../utils/openAPI";
import { filterByDate } from "../utils";

export const getReceipts: WMSOperationHandler<"getReceipts"> = async (_c, req, res) => {
    const ds = getDataset();
    const { warehouseId, status, fromDate, toDate } = req.query as any;

    let receipts = ds.wms.receipts;
    if (warehouseId) receipts = receipts.filter((r) => r.warehouseId === warehouseId);
    if (status) receipts = receipts.filter((r) => r.status === status);
    receipts = filterByDate(receipts, fromDate, toDate, "receivedAt");

    return WMSreplyJSON({ data: receipts }, res);
};
