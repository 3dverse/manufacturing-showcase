import { listFolderAssets } from "@3dverse/api";
import { generate } from "./index";
import { setDataset } from "./store";
import { STATIC_SITE_ID, defaultSite } from "./input";
import { loadSiteFromScene } from "./site";
import config from "../config";

//------------------------------------------------------------------------------
export type BootstrapResult = {
    regenerated: { sceneId: string; siteId: string; now: number }[];
    errors: { sceneId: string; message: string }[];
};

//------------------------------------------------------------------------------
export async function generateDatasetForScene(
    sceneId: string,
    seedOffset: number = 0,
): Promise<{ sceneId: string; siteId: string; now: number }> {
    const site = await loadSiteFromScene(sceneId);
    if (!site) throw new Error(`No site entity found in scene ${sceneId}`);

    const dataset = generate({ siteId: sceneId, site, seed: 42 + seedOffset });

    setDataset(sceneId, dataset);
    return { sceneId, siteId: dataset.siteId, now: Math.floor(dataset.now.getTime() / 1000) };
}

//------------------------------------------------------------------------------
export async function generateAllDatasetsFromFolder(): Promise<BootstrapResult> {
    const resp = await listFolderAssets({
        folder_id: config.publicFolderId,
        offset: 0,
        limit: 10,
        filters: { asset_types: ["scene"] },
    });

    const scenes = resp.data.scenes ?? [];
    const regenerated: BootstrapResult["regenerated"] = [];
    const errors: BootstrapResult["errors"] = [];

    await Promise.all(
        scenes.map(async (scene, index) => {
            try {
                const meta = await generateDatasetForScene(scene.asset_id, index);
                regenerated.push(meta);
                console.log(`[bootstrap] Dataset ready: ${scene.name} (${scene.asset_id})`);
            } catch (err: any) {
                errors.push({ sceneId: scene.asset_id, message: err?.message ?? String(err) });
                console.warn(`[bootstrap] Failed to generate dataset for ${scene.asset_id}:`, err);
            }
        }),
    );

    return { regenerated, errors };
}

//------------------------------------------------------------------------------
/** Generate all from folder, fall back to static default if nothing loads. */
export async function bootstrapDatasets(): Promise<void> {
    try {
        const { regenerated } = await generateAllDatasetsFromFolder();
        if (regenerated.length > 0) return;
    } catch (err) {
        console.warn("[bootstrap] Folder load failed:", err);
    }

    console.warn("[bootstrap] Falling back to static default site.");
    const dataset = generate({ siteId: STATIC_SITE_ID, site: defaultSite });
    setDataset(STATIC_SITE_ID, dataset);
}
