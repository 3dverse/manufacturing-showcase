import { getDatasetForRequest } from "../utils";
import { ERPreplyJSON, type ERPOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const getCompanies: ERPOperationHandler<"getCompanies"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { page = "1", pageSize = "50" } = req.query as any;
    const list = [...ds.erp.companies.values()];
    return ERPreplyJSON(paginate(list, +page, +pageSize), res);
};
