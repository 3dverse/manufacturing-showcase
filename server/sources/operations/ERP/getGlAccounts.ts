import { getDatasetForRequest } from "../utils";
import { ERPreplyJSON, type ERPOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const getGlAccounts: ERPOperationHandler<"getGlAccounts"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { companyId, accountType, page = "1", pageSize = "50" } = req.query as any;

    let accounts = ds.erp.glAccountList;
    if (companyId) accounts = accounts.filter((a) => a.companyId === companyId);
    if (accountType) accounts = accounts.filter((a) => a.accountType === accountType);

    return ERPreplyJSON(paginate(accounts, +page, +pageSize), res);
};
