import { getDatasetForRequest } from "../utils";
import { ERPreplyJSON, type ERPOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const getSalesOrders: ERPOperationHandler<"getSalesOrders"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { companyId, siteId, customerId, status, orderDateFrom, orderDateTo, page = "1", pageSize = "50" } = req.query as any;

    let sos = ds.erp.salesOrderList;
    if (companyId) sos = sos.filter((so) => so.companyId === companyId);
    if (siteId) sos = sos.filter((so) => so.siteId === siteId);
    if (customerId) sos = sos.filter((so) => so.customerId === customerId);
    if (status) sos = sos.filter((so) => so.status === status);
    if (orderDateFrom) sos = sos.filter((so) => so.orderDate >= orderDateFrom);
    if (orderDateTo) sos = sos.filter((so) => so.orderDate <= orderDateTo);

    return ERPreplyJSON(paginate(sos, +page, +pageSize), res);
};
