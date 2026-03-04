import { useCallback, useContext, useMemo } from "react";

//------------------------------------------------------------------------------
import { AreaWidget } from "@/components/nodes/areas/AreaWidget";
import { CellWidget } from "@/components/nodes/cells/CellWidget";
import { FlowWidget } from "@/components/nodes/flows/FlowWidget";
import { AreaStorageQuadPanel } from "@/components/nodes/areas/storage/AreaStorageQuadPanel";
import { GenericAreaQuadPanel } from "@/components/nodes/areas/GenericAreaQuadPanel";

//------------------------------------------------------------------------------
import { FactoryContext } from "@/contexts/FactoryContext";
import { SelectionContext } from "@/contexts/SelectionContext";

//------------------------------------------------------------------------------

import { NodeTypes } from "@/content/enums";

import type { AreaNode, CellNode, FactoryGraphNode } from "@/content/type";
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const FactoryBuilder = () => {
    //--------------------------------------------------------------------------
    // Context
    const { nodeGraph } = useContext(FactoryContext);
    const { selectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    const shownCells = useMemo(() => {
        switch (selectedNode?.type) {
            case NodeTypes.factory:
                return selectedNode.areas.reduce((acc: CellNode[], area) => {
                    acc.push(...area.cells);
                    return acc;
                }, []);
            case NodeTypes.line:
            case NodeTypes.area:
                return selectedNode.cells;
            default:
                return [];
        }
    }, [selectedNode]);

    //--------------------------------------------------------------------------
    const shownFlowPairs = useMemo(() => {
        if (selectedNode && [NodeTypes.line, NodeTypes.cell, NodeTypes.machine].includes(selectedNode.type)) {
            return [];
        }
        return nodeGraph?.areas.flatMap((area) => area.flows.pairs) || [];
    }, [nodeGraph, selectedNode]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <>
            {nodeGraph?.areas.map((area) => <AreaBuilderItem key={area.euid} area={area} />)}
            {shownCells.map((cell) => (
                <CellBuilderItem key={cell.euid} cell={cell} />
            ))}
            {shownFlowPairs.map((pair) => (
                <FlowWidget key={pair.in.euid} pair={pair} />
            ))}

            <QuadPanels />
        </>
    );
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const CellBuilderItem = ({ cell }: { cell: CellNode }) => {
    //--------------------------------------------------------------------------
    // Context
    const { selectedNode, setSelectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    // Handlers
    const clickHandler = useCallback((node: FactoryGraphNode) => setSelectedNode(node), [setSelectedNode]);

    //--------------------------------------------------------------------------
    // Render
    return <CellWidget key={cell.euid} cell={cell} selectedNode={selectedNode} onClick={clickHandler} />;
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const AreaBuilderItem = ({ area }: { area: AreaNode }) => {
    //--------------------------------------------------------------------------
    // Context
    const { selectedNode, setSelectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    // Handlers
    const clickHandler = useCallback((node: FactoryGraphNode) => setSelectedNode(node), [setSelectedNode]);

    //--------------------------------------------------------------------------
    // Render
    return <AreaWidget key={area.euid} area={area} selectedNode={selectedNode} onClick={clickHandler} />;
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const QuadPanels = () => {
    //--------------------------------------------------------------------------
    const { selectedNode } = useContext(SelectionContext);
    const isAreaSelected = selectedNode?.type === NodeTypes.area;

    //--------------------------------------------------------------------------
    if (!selectedNode || !isAreaSelected) return null;
    //--------------------------------------------------------------------------
    return (
        <>
            {selectedNode.name === "storage" ? (
                <AreaStorageQuadPanel area={selectedNode as AreaNode} />
            ) : (
                <GenericAreaQuadPanel area={selectedNode as AreaNode} />
            )}
        </>
    );
};

export default FactoryBuilder;
