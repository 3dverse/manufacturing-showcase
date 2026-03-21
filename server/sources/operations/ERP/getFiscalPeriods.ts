import { getDataset } from "../../generator/store";
import { ERPreplyJSON, type ERPOperationHandler } from "../../utils/openAPI";

export const getFiscalPeriods: ERPOperationHandler<"getFiscalPeriods"> = async (_c, req, res) => {
    const ds = getDataset();
    const { companyId, year, status } = req.query as any;

    let periods = [...ds.erp.fiscalPeriods];
    if (companyId) periods = periods.filter((p) => p.companyId === companyId);
    if (year) periods = periods.filter((p) => p.fiscalYear === +year);
    if (status) periods = periods.filter((p) => p.status === status);

    return ERPreplyJSON({ data: periods }, res);
};
