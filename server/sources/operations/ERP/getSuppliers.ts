import { getDataset } from "../../generator/store";
import { ERPreplyJSON, type ERPOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const getSuppliers: ERPOperationHandler<"getSuppliers"> = async (_c, req, res) => {
    const ds = getDataset();
    const { companyId, status, updatedSince, page = "1", pageSize = "50" } = req.query as any;

    let supps = ds.erp.supplierList;
    if (companyId) supps = supps.filter((s) => s.companyId === companyId);
    if (status) supps = supps.filter((s) => s.status === status);
    if (updatedSince) supps = supps.filter((s) => s.updatedAt >= updatedSince);

    return ERPreplyJSON(paginate(supps, +page, +pageSize), res);
};
