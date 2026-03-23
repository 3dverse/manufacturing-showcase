import { getDatasetForRequest } from "../utils";
import { ERPreplyJSON, type ERPOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const getCostCenters: ERPOperationHandler<"getCostCenters"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { companyId, status, page = "1", pageSize = "50" } = req.query as any;

    let ccs = ds.erp.costCenterList;
    if (companyId) ccs = ccs.filter((c) => c.companyId === companyId);
    if (status) ccs = ccs.filter((c) => c.status === status);

    return ERPreplyJSON(paginate(ccs, +page, +pageSize), res);
};
