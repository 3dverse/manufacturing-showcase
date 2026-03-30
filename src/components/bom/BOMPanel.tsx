import { useState, useEffect, useMemo, useContext, useCallback } from "react";
import "@xyflow/react/dist/style.css";

//------------------------------------------------------------------------------
import { SelectionContext } from "@/contexts/SelectionContext";
import { HoverContext } from "@/contexts/HoverContext";
import { FactoryContext } from "@/contexts/FactoryContext";

//------------------------------------------------------------------------------
import { isCell } from "@/core/NavGraph";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { BOMNodeData, MESRoutingItem } from "./type";
import { findNodeByWorkCenter } from "./utils";
import { BOMFlow } from "./BomFlow";
import { BOMDetails } from "./BOMDetails";

//------------------------------------------------------------------------------
const API = "/-/api/dataset";
const MES_API = "/-/api/mes";
const SHOW_DETAILS = false;

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export function BOMPanel({ className }: { className?: string }) {
    //--------------------------------------------------------------------------
    // State
    const [routings, setRoutings] = useState<MESRoutingItem[]>([]);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [bom, setBom] = useState<BOMNodeData | null>(null);
    const [bomLoading, setBomLoading] = useState(false);

    //--------------------------------------------------------------------------
    // Contexts
    const { nodeList, factory } = useContext(FactoryContext);
    const { hoveredNode, setHoveredNode } = useContext(HoverContext);
    const { selectedNode, setSelectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    // Memos
    const siteId = useMemo(() => factory.scene_id, [factory]);

    //--------------------------------------------------------------------------
    const selectedWorkCenterId = useMemo(
        () => (selectedNode && isCell(selectedNode) ? selectedNode.hash : undefined),
        [selectedNode],
    );

    //--------------------------------------------------------------------------
    const hoveredWorkCenterId = useMemo(
        () => (hoveredNode && isCell(hoveredNode) ? hoveredNode.hash : undefined),
        [hoveredNode],
    );

    //--------------------------------------------------------------------------

    const cellsByWorkCenterId = useMemo(() => {
        const map = new Map<string, (typeof nodeList)[number]>();
        for (const node of nodeList) {
            if (!isCell(node)) continue;
            map.set(node.hash, node);
        }
        return map;
    }, [nodeList]);

    //--------------------------------------------------------------------------
    const selectedBOMNode = useMemo(
        () => (bom && selectedWorkCenterId ? findNodeByWorkCenter(bom, selectedWorkCenterId) : undefined),
        [bom, selectedWorkCenterId],
    );

    //--------------------------------------------------------------------------
    // Handlers
    const nodeHoverHandler = useCallback(
        (workCenterId: string | undefined) => {
            if (!workCenterId) {
                setHoveredNode(undefined, "nav");
                return;
            }
            const cell = cellsByWorkCenterId.get(workCenterId);
            if (cell) setHoveredNode(cell, "nav");
        },
        [cellsByWorkCenterId, setHoveredNode],
    );

    //--------------------------------------------------------------------------
    const nodeClickHandler = useCallback(
        (workCenterId: string) => {
            const cell = cellsByWorkCenterId.get(workCenterId);
            if (cell) setSelectedNode(cell);
        },
        [cellsByWorkCenterId, setSelectedNode],
    );

    //--------------------------------------------------------------------------
    const deselectHandler = useCallback(() => {
        setSelectedNode(undefined);
    }, [setSelectedNode]);

    //--------------------------------------------------------------------------
    // Effects
    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const resp = await fetch(`${MES_API}/routing?siteId=${siteId}`);
                const data = await resp.json();
                const items: MESRoutingItem[] = data.data ?? [];
                if (!cancelled) {
                    setRoutings(items);
                    setSelectedIdx(0);
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                if (!cancelled) setError(err?.message ?? "Failed to load routings");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, [siteId]);

    //--------------------------------------------------------------------------
    useEffect(() => {
        if (routings.length === 0) return;
        const routing = routings[selectedIdx];
        if (!routing) return;
        let cancelled = false;
        async function load() {
            setBomLoading(true);
            setBom(null);
            try {
                const resp = await fetch(`${API}/bom/${routing.itemId}?siteId=${siteId}`);
                const data = await resp.json();
                if (!cancelled) setBom(data.data as BOMNodeData);
            } catch {
                /* ignore */
            } finally {
                if (!cancelled) setBomLoading(false);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, [routings, selectedIdx, siteId]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <div className={cn("pointer-events-auto", className)}>
            {loading ? (
                <p className="px-6 py-4 text-xs text-subtle animate-pulse">Loading…</p>
            ) : error ? (
                <p className="px-6 py-3 text-xs text-negative-600">{error}</p>
            ) : routings.length === 0 ? (
                <p className="px-6 py-3 text-xs text-subtle">No routings found.</p>
            ) : (
                <>
                    <div className="">
                        {bomLoading ? (
                            <div className="h-64 flex items-center justify-center text-xs text-subtle animate-pulse">
                                Loading BOM…
                            </div>
                        ) : bom ? (
                            <BOMFlow
                                root={bom}
                                selectedWorkCenterId={selectedWorkCenterId}
                                hoveredWorkCenterId={hoveredWorkCenterId}
                                onNodeClick={nodeClickHandler}
                                onNodeHover={nodeHoverHandler}
                            />
                        ) : null}
                    </div>
                    {SHOW_DETAILS && selectedBOMNode && (
                        <BOMDetails BOMNode={selectedBOMNode} onDeselect={deselectHandler} />
                    )}
                </>
            )}
        </div>
    );
}
