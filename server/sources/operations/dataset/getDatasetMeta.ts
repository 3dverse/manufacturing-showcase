import { getDataset, listDatasetMetas } from "../../generator/store";
import { DatasetreplyJSON } from "../../utils/openAPI";

export const getDatasetMeta = async (_c: any, req: any, res: any) => {
    const { siteId } = req.query as any;

    if (siteId) {
        const ds = getDataset(siteId);
        return DatasetreplyJSON(
            {
                now: Math.floor(ds.now.getTime() / 1000),
                siteId: ds.siteId,
            },
            res,
        );
    }

    // No siteId — return metadata for all sites
    return DatasetreplyJSON({ sites: listDatasetMetas() }, res);
};
