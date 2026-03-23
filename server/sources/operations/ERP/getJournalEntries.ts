import { getDatasetForRequest } from "../utils";
import { ERPreplyJSON, type ERPOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const getJournalEntries: ERPOperationHandler<"getJournalEntries"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { companyId, postingDateFrom, postingDateTo, fiscalPeriodId, page = "1", pageSize = "50" } = req.query as any;

    let jes = ds.erp.journalEntryList;
    if (companyId) jes = jes.filter((je) => je.companyId === companyId);
    if (postingDateFrom) jes = jes.filter((je) => je.postingDate >= postingDateFrom);
    if (postingDateTo) jes = jes.filter((je) => je.postingDate <= postingDateTo);
    if (fiscalPeriodId) jes = jes.filter((je) => je.fiscalPeriodId === fiscalPeriodId);

    return ERPreplyJSON(paginate(jes, +page, +pageSize), res);
};
