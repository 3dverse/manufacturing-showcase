import { getDataset } from "../../generator/store";
import { ERPreplyJSON, type ERPOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const getCustomers: ERPOperationHandler<"getCustomers"> = async (_c, req, res) => {
    const ds = getDataset();
    const { companyId, status, updatedSince, page = "1", pageSize = "50" } = req.query as any;

    let custs = ds.erp.customerList;
    if (companyId) custs = custs.filter((c) => c.companyId === companyId);
    if (status) custs = custs.filter((c) => c.status === status);
    if (updatedSince) custs = custs.filter((c) => c.updatedAt >= updatedSince);

    return ERPreplyJSON(paginate(custs, +page, +pageSize), res);
};
