import { getDatasetForRequest } from "../utils";
import { QMSreplyJSON, type QMSOperationHandler } from "../../utils/openAPI";
import { paginate } from "../utils";

export const getCapas: QMSOperationHandler<"getCapas"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { status, type, priority, owner, dueFrom, dueTo, page = "1", pageSize = "50" } = req.query as any;

    let capas = ds.qms.capaList.map((id) => ds.qms.capas.get(id)!);

    if (status) capas = capas.filter((c) => c.status === status);
    if (type) capas = capas.filter((c) => c.type === type);
    if (priority) capas = capas.filter((c) => c.priority === priority);
    if (owner) capas = capas.filter((c) => c.owner === owner);
    if (dueFrom) capas = capas.filter((c) => c.dueAt >= dueFrom);
    if (dueTo) capas = capas.filter((c) => c.dueAt <= dueTo);

    return QMSreplyJSON(paginate(capas, +page, +pageSize), res);
};
