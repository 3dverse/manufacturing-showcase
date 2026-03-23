import fs from "fs";
import path from "path";
import type { Dataset } from "./types";

const _datasets = new Map<string, Dataset>();
const PERSIST = false;

function mapReplacer(_key: string, value: unknown): unknown {
    if (value instanceof Map) {
        return Object.fromEntries(value);
    }
    return value;
}

export function setDataset(sceneId: string, d: Dataset): void {
    _datasets.set(sceneId, d);

    if (!PERSIST) return;
    try {
        const outPath = path.resolve(`dist/dataset-${sceneId}.json`);
        fs.writeFileSync(outPath, JSON.stringify(d, mapReplacer, 2));
        console.log(`[dataset] saved to ${outPath}`);
    } catch (err) {
        console.warn("[dataset] failed to save JSON:", err);
    }
}

export function getDataset(siteId?: string): Dataset {
    if (siteId) {
        const ds = _datasets.get(siteId);
        if (ds) return ds;
    }
    // Fall back to first available dataset
    const first = _datasets.values().next().value as Dataset | undefined;
    if (!first) throw new Error("Dataset not initialized. Call setDataset() first.");
    return first;
}

export function listDatasetMetas(): { sceneId: string; siteId: string; now: number }[] {
    return Array.from(_datasets.entries()).map(([sceneId, ds]) => ({
        sceneId,
        siteId: ds.siteId,
        now: Math.floor(ds.now.getTime() / 1000),
    }));
}
