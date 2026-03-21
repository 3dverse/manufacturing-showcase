import { getDataset } from "../../generator/store";
import { QMSreplyJSON, type QMSOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const getDeviations: QMSOperationHandler<"getDeviations"> = async (_c, req, res) => {
    const ds = getDataset();
    const { status, category, impactLevel, raisedFrom, raisedTo, page = "1", pageSize = "50" } = req.query as any;

    let devs = ds.qms.deviationList.map((id) => ds.qms.deviations.get(id)!);

    if (status) devs = devs.filter((d) => d.status === status);
    if (category) devs = devs.filter((d) => d.category === category);
    if (impactLevel) devs = devs.filter((d) => d.impactLevel === impactLevel);
    if (raisedFrom) devs = devs.filter((d) => d.raisedAt >= raisedFrom);
    if (raisedTo) devs = devs.filter((d) => d.raisedAt <= raisedTo);

    return QMSreplyJSON(paginate(devs, +page, +pageSize), res);
};
