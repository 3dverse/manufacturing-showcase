import { getDatasetForRequest } from "../utils";
import { WMSreplyJSON, type WMSOperationHandler } from "../../utils/openAPI";

export const getReceipts: WMSOperationHandler<"getReceipts"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { warehouseId, status, fromDate, toDate } = req.query as any;

    let receipts = ds.wms.receipts;
    if (warehouseId) receipts = receipts.filter((r) => r.warehouseId === warehouseId);
    if (status) receipts = receipts.filter((r) => r.status === status);
    if (fromDate) receipts = receipts.filter((r) => r.receivedDate >= Number(fromDate));
    if (toDate)   receipts = receipts.filter((r) => r.receivedDate <= Number(toDate));

    return WMSreplyJSON({ data: receipts }, res);
};
