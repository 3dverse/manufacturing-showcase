import { getDataset } from "../../generator/store";
import { ERPreplyJSON, type ERPOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getSupplierById: ERPOperationHandler<"getSupplierById"> = async (_c, req, res) => {
    const ds = getDataset();
    const id = req.params.supplierId as string;
    const supp = ds.erp.suppliers.get(id);
    if (!supp) return notFound(id, res) as any;
    return ERPreplyJSON({ data: supp }, res);
};
