import { getDatasetForRequest } from "../utils";
import { ERPreplyJSON, type ERPOperationHandler } from "../../utils/openAPI";

export const getCurrencies: ERPOperationHandler<"getCurrencies"> = async (_c, _req, res) => {
    const ds = getDatasetForRequest(_req);
    return ERPreplyJSON({ data: ds.erp.currencies }, res);
};
