import { DatasetreplyJSON } from "../../utils/openAPI";
import { loadSiteFromScene } from "../../generator/site";

// Re-export types and utilities consumed by other operations files
export type { SiteNode, LocationNode, WorkCenterNode, MachineNode, GraphNode } from "../../generator/site";
export { NodeTypes, hashNode, sortNode, sortEntity } from "../../generator/site";

export const getSiteGraph = async (_c: any, req: any, res: any) => {
    const { sceneId } = req.query as any;
    if (!sceneId) return DatasetreplyJSON({ error: "sceneId query param required" }, res, 400) as any;
    const graph = await loadSiteFromScene(sceneId);
    return DatasetreplyJSON({ graph }, res);
};
