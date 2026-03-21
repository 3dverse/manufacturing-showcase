import { getDataset } from "../../generator/store";
import { QMSreplyJSON, type QMSOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getDeviationById: QMSOperationHandler<"getDeviationById"> = async (_c, req, res) => {
    const ds = getDataset();
    const id = req.params.deviationId as string;
    const dev = ds.qms.deviations.get(id);
    if (!dev) return notFound(id, res) as any;
    return QMSreplyJSON(dev, res);
};
