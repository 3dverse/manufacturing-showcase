import { getDataset } from "../../generator/store";
import { ERPreplyJSON, type ERPOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getCustomerById: ERPOperationHandler<"getCustomerById"> = async (_c, req, res) => {
    const ds = getDataset();
    const id = req.params.customerId as string;
    const cust = ds.erp.customers.get(id);
    if (!cust) return notFound(id, res) as any;
    return ERPreplyJSON({ data: cust }, res);
};
