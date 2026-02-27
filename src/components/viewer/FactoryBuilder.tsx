import { useCallback, useContext } from "react";

//------------------------------------------------------------------------------
import { AreaWidget } from "@/components/viewer/areas/AreaWidget";
import { AreaProductionPanel } from "@/components/viewer/areas/production/AreaProductionPanel";
import { CellPanel } from "@/components/viewer/cells/CellPanel";

//------------------------------------------------------------------------------
import { FactoryContext } from "@/contexts/FactoryContext";
import { SelectionContext } from "@/contexts/SelectionContext";

//------------------------------------------------------------------------------
import type { AreaNode, CellNode, FactoryGraphNode } from "@/content/type";
import { NodeTypes } from "@/content/enums";

//------------------------------------------------------------------------------
const FactoryBuilder = () => {
    //--------------------------------------------------------------------------
    // Context
    const { nodeGraph } = useContext(FactoryContext);
    const { selectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    // Render
    return (
        <>
            {/* Overlays and QuadPanels */}
            {nodeGraph?.areas.map((area) => (
                <FactoryBuilderItem key={area.euid} area={area} />
            ))}

            {/* Panels */}
            {selectedNode?.type === NodeTypes.area && selectedNode.name === "production" && (
                <AreaProductionPanel area={selectedNode as AreaNode} />
            )}
            {selectedNode?.type === NodeTypes.cell && <CellPanel cell={selectedNode as CellNode} />}
        </>
    );
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const FactoryBuilderItem = ({ area }: { area: AreaNode }) => {
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

export default FactoryBuilder;
