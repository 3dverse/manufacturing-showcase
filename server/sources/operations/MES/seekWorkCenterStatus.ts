import { binarySearchTimeline } from "../../generator/timeline";
import type { CellTimeline } from "../../generator/types";

export function seekWorkCenterStatus(cellTimeline: CellTimeline | undefined, now: Date): string {
    if (!cellTimeline || cellTimeline.entries.length === 0) return "offline";
    const idx = binarySearchTimeline(cellTimeline.entries, now);
    if (idx >= 0) {
        const entry = cellTimeline.entries[idx];
        if (entry.end > now) {
            return entry.type === "downtime" ? "down" : "running";
        }
    }
    // Check if there's upcoming work
    const next = cellTimeline.entries.find((e) => e.start > now);
    return next ? "idle" : "starved";
}
