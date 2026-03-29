import { getDatasetForRequest } from "../utils";
import { MESreplyJSON, type MESOperationHandler } from "../../utils/openAPI";

export const listRoutings: MESOperationHandler<"listRoutings"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { itemCode } = req.query as any;

    let routings = ds.mes.routingList.map((id) => ds.mes.routings.get(id)!).filter(Boolean);

    if (itemCode) routings = routings.filter((r) => r.itemCode === itemCode);

    return MESreplyJSON({ data: routings }, res);
};
