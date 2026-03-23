import { getDatasetForRequest } from "../utils";
import { EAMreplyJSON, type EAMOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getInspectionById: EAMOperationHandler<"getInspectionById"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const id = req.params.inspectionId as string;
    const insp = ds.eam.inspections.get(id);
    if (!insp) return notFound(id, res) as any;
    return EAMreplyJSON(insp, res);
};
