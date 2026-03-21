import { getDataset } from "../../generator/store";
import { ERPreplyJSON, type ERPOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getCompanyById: ERPOperationHandler<"getCompanyById"> = async (_c, req, res) => {
    const ds = getDataset();
    const id = req.params.companyId as string;
    const company = ds.erp.companies.get(id);
    if (!company) return notFound(id, res) as any;
    return ERPreplyJSON({ data: company }, res);
};
