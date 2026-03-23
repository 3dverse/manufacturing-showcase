import { getDatasetForRequest } from "../utils";
import { ERPreplyJSON, type ERPOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getInvoiceById: ERPOperationHandler<"getInvoiceById"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const id = req.params.invoiceId as string;
    const inv = ds.erp.invoices.get(id);
    if (!inv) return notFound(id, res) as any;
    return ERPreplyJSON({ data: inv }, res);
};
