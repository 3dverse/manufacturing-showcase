import { getDataset } from "../../generator/store";
import { getBOMTree } from "../../generator/routing";
import { notFound } from "../utils";

export const getBOM = (_c: any, req: any, res: any) => {
    const { siteId } = req.query as any;
    const { itemId } = req.params as any;

    const ds  = getDataset(siteId);
    const bom = getBOMTree(ds.routingTemplates, itemId);

    if (!bom) return notFound(itemId, res);

    return res.json({ data: bom });
};
