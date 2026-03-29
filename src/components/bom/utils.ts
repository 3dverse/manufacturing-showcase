import { type Node, type Edge } from "@xyflow/react";
import dagre from "@dagrejs/dagre";

//------------------------------------------------------------------------------
import type { BOMFlowData, BOMNodeData } from "./type";
import { GRAPH_PADDING, NODE_HEIGHT, NODE_WIDTH } from "./content";

//------------------------------------------------------------------------------
export function findNodeByWorkCenter(root: BOMNodeData, workCenterId: string): BOMNodeData | null {
    if (root.producedBy?.workCenterId === workCenterId) return root;
    for (const child of root.children) {
        const found = findNodeByWorkCenter(child, workCenterId);
        if (found) return found;
    }
    return null;
}

//------------------------------------------------------------------------------
export function buildFlowGraph(root: BOMNodeData): {
    nodes: Node<BOMFlowData>[];
    edges: Edge[];
    graphWidth: number;
    graphHeight: number;
} {
    const nodes: Node<BOMFlowData>[] = [];
    const edges: Edge[] = [];
    let counter = 0;

    function traverse(node: BOMNodeData, parentFlowId: string | null) {
        const id = `n${counter++}`;
        const data: BOMFlowData = {
            itemId: node.itemId,
            itemType: node.itemType,
            operationCode: node.producedBy?.operationCode,
            operationType: node.producedBy?.operationType,
            workCenterOperationType: node.producedBy?.workCenterOperationType,
            workCenterId: node.producedBy?.workCenterId,
        };
        nodes.push({ id, type: "bom", position: { x: 0, y: 0 }, data });
        if (parentFlowId !== null) {
            edges.push({ id: `e${id}-${parentFlowId}`, source: id, target: parentFlowId, type: "smoothstep" });
        }
        for (const child of node.children) traverse(child, id);
    }

    traverse(root, null);

    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: "LR", ranksep: 60, nodesep: 20 });
    g.setDefaultEdgeLabel(() => ({}));
    for (const n of nodes) g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    for (const e of edges) g.setEdge(e.source, e.target);
    dagre.layout(g);

    let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
    for (const n of nodes) {
        const pos = g.node(n.id);
        n.position = { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 };
        minX = Math.min(minX, n.position.x);
        minY = Math.min(minY, n.position.y);
        maxX = Math.max(maxX, n.position.x + NODE_WIDTH);
        maxY = Math.max(maxY, n.position.y + NODE_HEIGHT);
    }
    for (const n of nodes) {
        n.position = { x: n.position.x - minX + GRAPH_PADDING, y: n.position.y - minY + GRAPH_PADDING };
    }

    return {
        nodes,
        edges,
        graphWidth: maxX - minX + GRAPH_PADDING * 2,
        graphHeight: maxY - minY + GRAPH_PADDING * 2,
    };
}
