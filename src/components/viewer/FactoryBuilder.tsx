import { useCallback, useContext, useMemo } from "react";

//------------------------------------------------------------------------------
import { AreaStorageQuadPanel } from "@/components/nodes/areas/storage/AreaStorageQuadPanel";
import { FloatingLabel } from "./DOM3D/FloatingLabel";
import { AnchoredPanel } from "./DOM3D/AnchoredPanel";
import { FloorOutline } from "./DOM3D/FloorOutline";
import { FloorRegion } from "./DOM3D/FloorRegion";
import { NodeSummary } from "./DOM3D/NodeSummary";
import { FlowSpline } from "./DOM3D/FlowSpline";
import { AreaStorageOverlay } from "../nodes/areas/storage/AreaStorageOverlay";
import { TopPanel } from "./DOM3D/TopPanel";

//------------------------------------------------------------------------------
import { FactoryContext } from "@/contexts/FactoryContext";
import { SelectionContext } from "@/contexts/SelectionContext";

//------------------------------------------------------------------------------
import type { AreaNode, CellNode, FactoryGraphNode, LineNode } from "@/content/type";
import { NodeTypes } from "@/content/enums";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const FactoryBuilder = () => {
    //--------------------------------------------------------------------------
    // Context
    const { nodeGraph } = useContext(FactoryContext);
    const { selectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    const shownLines = useMemo(() => {
        if (!selectedNode) return [];
        switch (selectedNode.type) {
            case NodeTypes.cell:
                if (selectedNode.parent.type === NodeTypes.area) {
                    return selectedNode.parent.lines;
                }
                if (selectedNode.parent.type === NodeTypes.line) {
                    return [];
                }
                return [];
            case NodeTypes.line:
                return selectedNode.parent.lines;
            case NodeTypes.area:
                return selectedNode.lines;
            default:
                return [];
        }
    }, [selectedNode]);

    //--------------------------------------------------------------------------
    const shownCells = useMemo(() => {
        switch (selectedNode?.type) {
            case NodeTypes.factory:
                return selectedNode.areas.reduce((acc: CellNode[], area) => {
                    acc.push(...area.cells);
                    for (const line of area.lines) {
                        acc.push(...line.cells);
                    }
                    return acc;
                }, []);
            case NodeTypes.area:
                return selectedNode.cells;
            case NodeTypes.line:
                return selectedNode.cells;
            default:
                return [];
        }
    }, [selectedNode]);

    //--------------------------------------------------------------------------
    // Render
    // Note: Always render Area and its children (Line/Cell) + flows
    // Show children nodes for selected Line
    return (
        <>
            {nodeGraph?.areas.map((area) => (
                <AreaBuilderItem key={area.euid} area={area} />
            ))}
            {shownLines.map((line) => (
                <LineBuilderItem key={line.euid} line={line} />
            ))}
            {shownCells.map((cell) => (
                <CellBuilderItem key={cell.euid} cell={cell} />
            ))}
            {nodeGraph?.flows.map((flow) => (
                <FlowSpline key={flow.euid} flow={flow} />
            ))}
        </>
    );
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const LineBuilderItem = ({ line }: { line: LineNode }) => {
    //--------------------------------------------------------------------------
    // Context
    const { setSelectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    // Handlers
    const clickHandler = useCallback((node: FactoryGraphNode) => setSelectedNode(node), [setSelectedNode]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <>
            <FloorRegion node={line} onClick={clickHandler} />
            <NodeSummary node={line} onClick={clickHandler} />
        </>
    );
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const CellBuilderItem = ({ cell }: { cell: CellNode }) => {
    //--------------------------------------------------------------------------
    // Context
    const { setSelectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    // Handlers
    const clickHandler = useCallback((node: FactoryGraphNode) => setSelectedNode(node), [setSelectedNode]);

    //--------------------------------------------------------------------------
    // Render
    if (cell.parent.type === NodeTypes.area) {
        return (
            <>
                <FloorRegion node={cell} onClick={clickHandler} />
                <NodeSummary node={cell} onClick={clickHandler} />
            </>
        );
    } else {
        return <FloatingLabel node={cell} onClick={clickHandler} />;
    }
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const AreaBuilderItem = ({ area }: { area: AreaNode }) => {
    //--------------------------------------------------------------------------
    // Context
    const { selectedNode, setSelectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    // Memos
    const isSelected = useMemo(() => area === selectedNode, [area, selectedNode]);
    const isChildSelected = selectedNode?.type === NodeTypes.cell && selectedNode?.parent?.euid === area.euid;

    //--------------------------------------------------------------------------
    // Handlers
    const clickHandler = useCallback((node: FactoryGraphNode) => setSelectedNode(node), [setSelectedNode]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <>
            <FloorOutline node={area} onClick={clickHandler} />
            {(isSelected || isChildSelected) && area.name === "storage" && (
                <div className="pointer-events-none">
                    <AreaStorageOverlay area={area} />
                </div>
            )}
            {isSelected && (
                <AnchoredPanel node={area}>
                    {area.name === "storage" && <AreaStorageQuadPanel area={area} />}
                </AnchoredPanel>
            )}
            {selectedNode?.type === NodeTypes.factory && (
                <TopPanel node={area} className="appear-in-from-left opacity-0 [--animation-delay:.75s]" />
            )}
        </>
    );
};

export default FactoryBuilder;
