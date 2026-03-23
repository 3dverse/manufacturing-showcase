import { getDatasetForRequest } from "../utils";
import { ERPreplyJSON, type ERPOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getItemById: ERPOperationHandler<"getItemById"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const id = req.params.itemId as string;
    const item = ds.erp.items.get(id);
    if (!item) return notFound(id, res) as any;
    return ERPreplyJSON({ data: item }, res);
};
