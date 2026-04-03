import type { InventoryMovement } from "../../_prebuild/api-libs/wms";
import { WMSInventory } from "./APIs";

//------------------------------------------------------------------------------
// Module-level cache: movements are fetched once per {siteId, warehouseId} and
// reused for all asOf projections. The dataset is static so this never expires.
const _movementCache = new Map<string, Promise<InventoryMovement[]>>();

function _fetchMovements(siteId: string, warehouseId: string): Promise<InventoryMovement[]> {
    const key = `${siteId}:${warehouseId}`;
    if (!_movementCache.has(key)) {
        _movementCache.set(
            key,
            WMSInventory.getInventoryMovements({ siteId, warehouseId }).then((r) => r.data.data ?? []),
        );
    }
    return _movementCache.get(key)!;
}

//------------------------------------------------------------------------------
export type BinOccupancy = { itemId: string; quantity: number; uom: string };

/**
 * Returns the occupancy state of every storage bin at a given point in time,
 * broken down by item. A bin holding multiple items produces multiple entries.
 *
 * Movements are fetched once and cached; subsequent calls with different asOf
 * values replay the log in memory with no additional network requests.
 *
 * @param siteId      - Site identifier for the dataset.
 * @param warehouseId - Storage warehouse hash (from the nav graph's storage area).
 * @param binIds      - All bin location IDs to include in the result.
 * @param asOf        - Unix timestamp to project inventory state at.
 * @returns A map from binId to all items currently in that bin (empty array = empty bin).
 */
export async function getBinOccupancy(params: {
    siteId: string;
    warehouseId: string;
    binIds: readonly string[];
    asOf: number;
}): Promise<Map<string, BinOccupancy[]>> {
    const { siteId, warehouseId, binIds, asOf } = params;
    const binSet = new Set(binIds);

    const movements = await _fetchMovements(siteId, warehouseId);

    // Replay all movements up to asOf, accumulating balance per {locationId, itemId}.
    const balances = new Map<string, { locationId: string; itemId: string; qty: number; uom: string }>();
    for (const mv of movements) {
        if (mv.occurredAt > asOf) continue;
        if (!mv.locationId || !binSet.has(mv.locationId)) continue;
        const key = `${mv.locationId}|${mv.itemId}`;
        if (!balances.has(key)) {
            balances.set(key, { locationId: mv.locationId, itemId: mv.itemId, qty: 0, uom: mv.uom });
        }
        balances.get(key)!.qty += mv.quantity;
    }

    // Build the result — every requested bin starts as an empty array.
    const result = new Map<string, BinOccupancy[]>(binIds.map((id) => [id, []]));
    for (const { locationId, itemId, qty, uom } of balances.values()) {
        if (qty > 0) result.get(locationId)!.push({ itemId, quantity: qty, uom });
    }

    return result;
}
