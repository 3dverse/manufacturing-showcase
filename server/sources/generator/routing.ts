/**
 * Helpers for querying the item / routing graph built in Phase 1.
 *
 * The BOM tree reflects how items are produced:
 *   - A finished good has a routing (sequence of steps).
 *   - Each step consumes one or more items (raw materials or WIP from a prior step)
 *     and produces one item (WIP or the finished good itself).
 *   - WIP items are themselves outputs of earlier routing steps, so the tree
 *     can be walked recursively.
 */

import type { FGRoutingTemplate, RoutingStepTemplate } from "./steps/phase1";

// ---------------------------------------------------------------------------
// BOM tree types
// ---------------------------------------------------------------------------

export type BOMNode = {
    itemId:   string;
    itemType: "finished_good" | "wip" | "raw_material";
    /** The routing step that produces this item, or undefined for raw materials. */
    producedBy: RoutingStepTemplate | undefined;
    children: BOMNode[];
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Maps outputItemId → the step that produces it, across all routings. */
function buildOutputIndex(
    routingTemplates: Map<string, FGRoutingTemplate>,
): Map<string, RoutingStepTemplate> {
    const index = new Map<string, RoutingStepTemplate>();
    for (const routing of routingTemplates.values()) {
        for (const step of routing.steps) {
            // Skip quality_control passthroughs: their outputItemId === inputItemId,
            // so they would overwrite the real producing step in the index.
            if (step.operationType === "quality_control") continue;
            index.set(step.outputItemId, step);
        }
    }
    return index;
}

function inferItemType(itemId: string): BOMNode["itemType"] {
    if (itemId.startsWith("FG-"))  return "finished_good";
    if (itemId.startsWith("WIP-")) return "wip";
    return "raw_material";
}

function buildNode(
    itemId:      string,
    outputIndex: Map<string, RoutingStepTemplate>,
    visited:     Set<string>,
): BOMNode {
    const producedBy = outputIndex.get(itemId);
    const children: BOMNode[] = [];

    if (producedBy && !visited.has(itemId)) {
        visited.add(itemId);
        for (const inputId of producedBy.inputItemIds) {
            children.push(buildNode(inputId, outputIndex, visited));
        }
        visited.delete(itemId);
    }

    return { itemId, itemType: inferItemType(itemId), producedBy, children };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the routing template for a finished good, or undefined if not found.
 */
export function getRouting(
    routingTemplates: Map<string, FGRoutingTemplate>,
    fgItemId: string,
): FGRoutingTemplate | undefined {
    return routingTemplates.get(fgItemId);
}

/**
 * Returns the routing step that produces a given item, or undefined for raw materials.
 */
export function getProducingStep(
    routingTemplates: Map<string, FGRoutingTemplate>,
    itemId: string,
): RoutingStepTemplate | undefined {
    for (const routing of routingTemplates.values()) {
        const step = routing.steps.find(s => s.outputItemId === itemId);
        if (step) return step;
    }
    return undefined;
}

/**
 * Returns the full BOM tree rooted at a finished good.
 * Each node lists its producing step and its input children recursively.
 */
export function getBOMTree(
    routingTemplates: Map<string, FGRoutingTemplate>,
    fgItemId: string,
): BOMNode | undefined {
    if (!routingTemplates.has(fgItemId)) return undefined;
    const outputIndex = buildOutputIndex(routingTemplates);
    return buildNode(fgItemId, outputIndex, new Set());
}

/**
 * Returns a flat list of all unique item IDs in the BOM for a finished good,
 * in breadth-first order (the FG itself is first).
 */
export function flattenBOM(
    routingTemplates: Map<string, FGRoutingTemplate>,
    fgItemId: string,
): string[] {
    const root = getBOMTree(routingTemplates, fgItemId);
    if (!root) return [];

    const result: string[] = [];
    const seen  = new Set<string>();
    const queue: BOMNode[] = [root];

    while (queue.length > 0) {
        const node = queue.shift()!;
        if (seen.has(node.itemId)) continue;
        seen.add(node.itemId);
        result.push(node.itemId);
        queue.push(...node.children);
    }

    return result;
}

/**
 * Returns all raw material item IDs consumed (transitively) by a finished good.
 */
export function getRawMaterials(
    routingTemplates: Map<string, FGRoutingTemplate>,
    fgItemId: string,
): string[] {
    return flattenBOM(routingTemplates, fgItemId).filter(id => inferItemType(id) === "raw_material");
}
