import { getDataset } from "../../generator/store";
import { ERPreplyJSON, type ERPOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const getCompanies: ERPOperationHandler<"getCompanies"> = async (_c, req, res) => {
    const ds = getDataset();
    const { page = "1", pageSize = "50" } = req.query as any;
    const list = [...ds.erp.companies.values()];
    return ERPreplyJSON(paginate(list, +page, +pageSize), res);
};
