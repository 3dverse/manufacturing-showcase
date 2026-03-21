import fs from "fs";
import path from "path";
import type { Dataset } from "./types";

let _dataset: Dataset | null = null;

function mapReplacer(_key: string, value: unknown): unknown {
    if (value instanceof Map) {
        return Object.fromEntries(value);
    }
    return value;
}

export function setDataset(d: Dataset): void {
    _dataset = d;
    try {
        const outPath = path.resolve("dist/dataset.json");
        fs.writeFileSync(outPath, JSON.stringify(d, mapReplacer, 2));
        console.log(`[dataset] saved to ${outPath}`);
    } catch (err) {
        console.warn("[dataset] failed to save JSON:", err);
    }
}

export function getDataset(): Dataset {
    if (!_dataset) throw new Error("Dataset not initialized. Call generateDataset() first.");
    return _dataset;
}
