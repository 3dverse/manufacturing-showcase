import { getDatasetForRequest } from "../utils";
import { ERPreplyJSON, type ERPOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const getItems: ERPOperationHandler<"getItems"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { companyId, itemType, status, updatedSince, page = "1", pageSize = "50" } = req.query as any;

    let items = ds.erp.itemList;
    if (companyId) items = items.filter((i) => i.companyId === companyId);
    if (itemType) items = items.filter((i) => i.itemType === itemType);
    if (status) items = items.filter((i) => i.status === status);
    if (updatedSince) items = items.filter((i) => i.updatedAt >= updatedSince);

    return ERPreplyJSON(paginate(items, +page, +pageSize), res);
};
