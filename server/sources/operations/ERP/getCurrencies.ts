import { getDataset } from "../../generator/store";
import { ERPreplyJSON, type ERPOperationHandler } from "../../utils/openAPI";

export const getCurrencies: ERPOperationHandler<"getCurrencies"> = async (_c, _req, res) => {
    const ds = getDataset();
    return ERPreplyJSON({ data: ds.erp.currencies }, res);
};
