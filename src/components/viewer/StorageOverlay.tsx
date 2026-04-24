import { useEffect, useMemo, useState } from "react";

//------------------------------------------------------------------------------
import { DOMEntity } from "@3dverse/livelink-react";
import type { Entity } from "@3dverse/livelink";

//------------------------------------------------------------------------------
import type { AreaNode } from "@/content/type";
import { getBinOccupancy, type BinOccupancy } from "@/core/occupancy";
import { useFactoryStore } from "@/store/useFactoryStore";
import { useTimelineStore } from "@/store/useTimelineStore";
import { itemColor } from "@/utils/itemColor";

//------------------------------------------------------------------------------
type OverlayNode = { entity: Entity; hash: string };

//------------------------------------------------------------------------------
export function StorageOverlay({ areaNode }: { areaNode: AreaNode }) {
    //--------------------------------------------------------------------------
    // Store
    const siteId = useFactoryStore((s) => s.currentFactory?.scene_id ?? "");
    const asOf = useTimelineStore((s) => s.asOf);
    const home = useTimelineStore((s) => s.home);
    const targetAsOf = asOf || home;

    //--------------------------------------------------------------------------
    // Derive display nodes and WMS bin IDs.
    //
    // Storage: has aisles → racks → bins; one WMS location per bin (bin.hash).
    // Delivery: has cells as display nodes; all movements go to a single zone
    //   bin (${areaNode.hash}-BIN-01), so we query that and distribute across cells.
    const { displayNodes, queryBinIds, isPerBin } = useMemo(() => {
        const bins: OverlayNode[] = areaNode.aisles.flatMap((a) => a.racks.flatMap((r) => r.bins));
        if (bins.length > 0) {
            return { displayNodes: bins, queryBinIds: bins.map((b) => b.hash), isPerBin: true };
        }
        const zoneBinId = `${areaNode.hash}-BIN-01`;
        return { displayNodes: areaNode.cells as OverlayNode[], queryBinIds: [zoneBinId], isPerBin: false };
    }, [areaNode]);

    //--------------------------------------------------------------------------
    // State
    const [occupancy, setOccupancy] = useState<Map<string, BinOccupancy[]>>(new Map());

    useEffect(() => {
        if (!siteId || !queryBinIds.length) return;
        getBinOccupancy({ siteId, warehouseId: areaNode.hash, binIds: queryBinIds, asOf: targetAsOf }).then(
            setOccupancy,
        );
    }, [siteId, areaNode.hash, queryBinIds, targetAsOf]);

    //--------------------------------------------------------------------------
    // Map display nodes to their occupancy.
    // Per-bin (storage): each node owns its slot.
    // Zone (delivery): distribute the zone's item list across display nodes.
    const nodeOccupancy = useMemo((): BinOccupancy[][] => {
        if (isPerBin) {
            return displayNodes.map((n) => occupancy.get(n.hash) ?? []);
        }
        const zoneBinId = queryBinIds[0];
        const items = [...(occupancy.get(zoneBinId) ?? [])].sort((a, b) => a.itemId.localeCompare(b.itemId));
        if (!items.length) return displayNodes.map(() => []);
        const perItem = Math.ceil(displayNodes.length / items.length);
        return displayNodes.map((_, i) => {
            const item = items[Math.floor(i / perItem)];
            return item ? [item] : [];
        });
    }, [isPerBin, displayNodes, occupancy, queryBinIds]);

    //--------------------------------------------------------------------------
    // Render
    return useMemo(() => {
        return displayNodes.map((node, i) => (
            <StorageOverlayItem key={node.hash} node={node} occupancy={nodeOccupancy[i]} />
        ));
    }, [displayNodes, nodeOccupancy]);
}

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
function StorageOverlayItem({ node, occupancy }: { node: OverlayNode; occupancy: BinOccupancy[] }) {
    //--------------------------------------------------------------------------
    // Memos
    const primary = useMemo(() => occupancy[0] ?? null, [occupancy]);

    //--------------------------------------------------------------------------
    const totalQty = useMemo(() => occupancy.reduce((s, o) => s + o.quantity, 0), [occupancy]);

    //--------------------------------------------------------------------------
    // Render
    if (!totalQty) return null;

    //--------------------------------------------------------------------------
    return (
        <DOMEntity entity={node.entity}>
            <div
                className="h-6 min-w-6 px-1 pointer-events-auto cursor-pointer rounded-full flex items-center justify-center text-[10px] font-bold text-black/70 leading-none"
                style={{ backgroundColor: primary ? itemColor(primary.itemId) : "rgba(100,116,139,0.5)" }}
            >
                {totalQty}
            </div>
        </DOMEntity>
    );
}
