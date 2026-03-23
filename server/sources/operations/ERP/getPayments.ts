import { getDatasetForRequest } from "../utils";
import { ERPreplyJSON, type ERPOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const getPayments: ERPOperationHandler<"getPayments"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { companyId, paymentType, paymentDateFrom, paymentDateTo, page = "1", pageSize = "50" } = req.query as any;

    let pays = ds.erp.paymentList;
    if (companyId) pays = pays.filter((p) => p.companyId === companyId);
    if (paymentType) pays = pays.filter((p) => p.paymentType === paymentType);
    if (paymentDateFrom) pays = pays.filter((p) => p.paymentDate >= paymentDateFrom);
    if (paymentDateTo) pays = pays.filter((p) => p.paymentDate <= paymentDateTo);

    return ERPreplyJSON(paginate(pays, +page, +pageSize), res);
};
