import { NodeSummary } from "./DOM3D/NodeSummary";
import { TopPanel } from "./DOM3D/TopPanel";
import { UnitOutPanel } from "./DOM3D/UnitOutPanel";

//------------------------------------------------------------------------------
import { NodeTypes } from "@/content/enums";
import type { AreaNode, FactoryNode, LineNode, SceneGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const NodeChildrensOverlay = ({ node }: { node: SceneGraphNode }) => {
    switch (node.type) {
        case NodeTypes.factory:
            return <FactoryChildrensOverlay factoryNode={node} />;
        case NodeTypes.area:
            return <AreaChildrensOverlay areaNode={node} />;
        case NodeTypes.line:
            return;
        case NodeTypes.cell:
            return;
        case NodeTypes.machine:
            return;
        case NodeTypes.aisle:
            return;
        case NodeTypes.rack:
            return;
        case NodeTypes.bin:
            return;
    }
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const FactoryChildrensOverlay = ({ factoryNode }: { factoryNode: FactoryNode }) => {
    return factoryNode.areas.map((areaNode) => <TopPanel key={areaNode.hash} node={areaNode} />);
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const AreaChildrensOverlay = ({ areaNode }: { areaNode: AreaNode }) => {
    return (
        <>
            {areaNode.lines.map((lineNode) => (
                <NodeSummary node={lineNode} key={lineNode.hash} />
            ))}
            {areaNode.cells.map((cellNode) => (
                <NodeSummary node={cellNode} key={cellNode.hash} />
            ))}
            {areaNode.cells.flatMap((cellNode) =>
                cellNode.outputs.map((out, index) => (
                    <UnitOutPanel key={out.hash} outNode={out} unitCompleted={96} unitTotal={952} delay={index} />
                )),
            )}
        </>
    );
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const LineChildrensOverlay = ({ lineNode }: { lineNode: LineNode }) => {
    {
        lineNode.cells.map((cellNode) => <NodeSummary node={cellNode} key={cellNode.hash} />);
    }
    {
        lineNode.cells.flatMap((cellNode, index) =>
            cellNode.outputs.map((out) => (
                <UnitOutPanel key={out.hash} outNode={out} unitCompleted={96} unitTotal={952} delay={index} />
            )),
        );
    }
};
