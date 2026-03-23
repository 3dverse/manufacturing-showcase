import { getDatasetForRequest } from "../utils";
import { ERPreplyJSON, type ERPOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getJournalEntryById: ERPOperationHandler<"getJournalEntryById"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const id = req.params.journalEntryId as string;
    const je = ds.erp.journalEntries.get(id);
    if (!je) return notFound(id, res) as any;
    return ERPreplyJSON({ data: je }, res);
};
