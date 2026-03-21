import { getDataset } from "../../generator/store";
import { QMSreplyJSON, type QMSOperationHandler } from "../../utils/openAPI";
import { notFound } from "../utils";

export const getCapaById: QMSOperationHandler<"getCapaById"> = async (_c, req, res) => {
    const ds = getDataset();
    const id = req.params.capaId as string;
    const capa = ds.qms.capas.get(id);
    if (!capa) return notFound(id, res) as any;
    return QMSreplyJSON(capa, res);
};
