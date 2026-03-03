import { useCallback, useContext } from "react";

//------------------------------------------------------------------------------
import { AreaWidget } from "@/components/nodes/areas/AreaWidget";
import { FlowWidget } from "@/components/nodes/flows/FlowWidget";
import { AreaStorageQuadPanel } from "@/components/nodes/areas/storage/AreaStorageQuadPanel";
import { GenericAreaQuadPanel } from "@/components/nodes/areas/GenericAreaQuadPanel";

//------------------------------------------------------------------------------
import { FactoryContext } from "@/contexts/FactoryContext";
import { SelectionContext } from "@/contexts/SelectionContext";

//------------------------------------------------------------------------------
import type { AreaNode, FactoryGraphNode } from "@/content/type";
import { NodeTypes } from "@/content/enums";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const FactoryBuilder = () => {
    //--------------------------------------------------------------------------
    // Context
    const { nodeGraph } = useContext(FactoryContext);

    //--------------------------------------------------------------------------
    // Render
    return (
        <>
            {nodeGraph?.areas.map((area) => (
                <AreaBuilderItem key={area.euid} area={area} />
            ))}
            {nodeGraph?.areas
                .flatMap((area) => area.flows.pairs)
                .map((pair) => (
                    <FlowWidget key={pair.in.euid} pair={pair} />
                ))}

            <QuadPanels />
        </>
    );
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
