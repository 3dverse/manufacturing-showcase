import { generateDatasetForScene, generateAllDatasetsFromFolder } from "../../generator/bootstrap";
import { DatasetreplyJSON } from "../../utils/openAPI";

export const regenerateDatasets = async (_c: any, req: any, res: any) => {
    const { siteId } = req.query as any;

    if (siteId) {
        try {
            const meta = await generateDatasetForScene(siteId);
            return DatasetreplyJSON({ regenerated: [meta], errors: [] }, res);
        } catch (err: any) {
            return DatasetreplyJSON(
                { regenerated: [], errors: [{ sceneId: siteId, message: err?.message ?? String(err) }] },
                res,
            );
        }
    }

    const result = await generateAllDatasetsFromFolder();
    return DatasetreplyJSON(result, res);
};
