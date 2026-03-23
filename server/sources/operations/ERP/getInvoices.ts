import { getDatasetForRequest } from "../utils";
import { ERPreplyJSON, type ERPOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const getInvoices: ERPOperationHandler<"getInvoices"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { companyId, invoiceType, status, invoiceDateFrom, invoiceDateTo, page = "1", pageSize = "50" } = req.query as any;

    let invs = ds.erp.invoiceList;
    if (companyId) invs = invs.filter((i) => i.companyId === companyId);
    if (invoiceType) invs = invs.filter((i) => i.invoiceType === invoiceType);
    if (status) invs = invs.filter((i) => i.status === status);
    if (invoiceDateFrom) invs = invs.filter((i) => i.invoiceDate >= invoiceDateFrom);
    if (invoiceDateTo) invs = invs.filter((i) => i.invoiceDate <= invoiceDateTo);

    return ERPreplyJSON(paginate(invs, +page, +pageSize), res);
};
