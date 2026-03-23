import { getDatasetForRequest } from "../utils";
import { ERPreplyJSON, type ERPOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const getPurchaseOrders: ERPOperationHandler<"getPurchaseOrders"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { companyId, supplierId, status, orderDateFrom, orderDateTo, page = "1", pageSize = "50" } = req.query as any;

    let pos = ds.erp.purchaseOrderList;
    if (companyId) pos = pos.filter((po) => po.companyId === companyId);
    if (supplierId) pos = pos.filter((po) => po.supplierId === supplierId);
    if (status) pos = pos.filter((po) => po.status === status);
    if (orderDateFrom) pos = pos.filter((po) => po.orderDate >= orderDateFrom);
    if (orderDateTo) pos = pos.filter((po) => po.orderDate <= orderDateTo);

    return ERPreplyJSON(paginate(pos, +page, +pageSize), res);
};
