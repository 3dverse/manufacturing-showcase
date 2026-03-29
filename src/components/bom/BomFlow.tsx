import { useCallback, useMemo } from "react";
import { ReactFlow, Background } from "@xyflow/react";
import type { Node as FlowNode } from "@xyflow/react";

//------------------------------------------------------------------------------
import { PERFORMANCE_MODE } from "@/content/3dverse";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";
import { buildFlowGraph } from "./utils";

//------------------------------------------------------------------------------
import { BOMNode } from "./BOMNode";

//------------------------------------------------------------------------------
import type { BOMFlowData, BOMNodeData } from "./type";

//------------------------------------------------------------------------------
const BOM_NODE_TYPES = { bom: BOMNode };

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export function BOMFlow({
    root,
    selectedWorkCenterId,
    hoveredWorkCenterId,
    onNodeClick,
    onNodeHover,
}: {
    root: BOMNodeData;
    selectedWorkCenterId?: string;
    hoveredWorkCenterId?: string;
    onNodeClick: (workCenterId: string) => void;
    onNodeHover?: (workCenterId: string | undefined) => void;
}) {
    //--------------------------------------------------------------------------
    // Memos
    const { nodes: baseNodes, edges, graphWidth, graphHeight } = useMemo(() => buildFlowGraph(root), [root]);

    //--------------------------------------------------------------------------
    const nodes = useMemo(
        () =>
            baseNodes.map((n) => ({
                ...n,
                data: {
                    ...n.data,
                    isSelected: !!selectedWorkCenterId && n.data.workCenterId === selectedWorkCenterId,
                    isHovered:
                        !selectedWorkCenterId && !!hoveredWorkCenterId && n.data.workCenterId === hoveredWorkCenterId,
                },
            })),
        [baseNodes, selectedWorkCenterId, hoveredWorkCenterId],
    );

    //--------------------------------------------------------------------------
    // Handlers
    const mouseClickHandler = useCallback(
        (_e: unknown, node: FlowNode<BOMFlowData>) => {
            if (node.data.workCenterId) onNodeClick(node.data.workCenterId);
        },
        [onNodeClick],
    );

    //--------------------------------------------------------------------------
    const mouseEnterHandler = useCallback(
        (_e: unknown, node: FlowNode<BOMFlowData>) => onNodeHover?.(node.data.workCenterId),
        [onNodeHover],
    );

    //--------------------------------------------------------------------------
    const mouseLeaveHandler = useCallback(() => onNodeHover?.(undefined), [onNodeHover]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <div
            className={cn(
                "border-t border-slate-200/15 overflow-auto bg-slate-50 max-h-96",
                PERFORMANCE_MODE ? "bg-slate-0/97" : "bg-slate-0/80 backdrop-blur-xl",
            )}
        >
            <div style={{ width: graphWidth, height: graphHeight }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={BOM_NODE_TYPES}
                    defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={false}
                    panOnDrag={false}
                    zoomOnScroll={false}
                    zoomOnPinch={false}
                    preventScrolling={false}
                    proOptions={{ hideAttribution: true }}
                    onNodeClick={mouseClickHandler}
                    onNodeMouseEnter={mouseEnterHandler}
                    onNodeMouseLeave={mouseLeaveHandler}
                >
                    <Background color="#cbd5e1" gap={20} />
                </ReactFlow>
            </div>
        </div>
    );
}
