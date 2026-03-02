import { useCallback, useContext } from "react";

//------------------------------------------------------------------------------
import { AreaWidget } from "@/components/viewer/areas/AreaWidget";

//------------------------------------------------------------------------------
import { FactoryContext } from "@/contexts/FactoryContext";
import { SelectionContext } from "@/contexts/SelectionContext";

//------------------------------------------------------------------------------
import type { AreaNode, FactoryGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const FactoryBuilder = () => {
    //--------------------------------------------------------------------------
    // Context
    const { nodeGraph } = useContext(FactoryContext);

    //--------------------------------------------------------------------------
    // Render
    return nodeGraph?.areas.map((area) => <FactoryBuilderItem key={area.euid} area={area} />);
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
