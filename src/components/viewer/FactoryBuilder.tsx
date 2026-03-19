import { useContext, useMemo } from "react";

//------------------------------------------------------------------------------
import { AreaStorageQuadPanel } from "@/components/nodes/areas/storage/AreaStorageQuadPanel";
import { AreaStorageOverlay } from "@/components/nodes/areas/storage/AreaStorageOverlay";
import { FloatingLabel } from "./DOM3D/FloatingLabel";
import { AnchoredPanel } from "./DOM3D/AnchoredPanel";
import { FloorOutline } from "./DOM3D/FloorOutline";
import { FloorRegion } from "./DOM3D/FloorRegion";
import { NodeSummary } from "./DOM3D/NodeSummary";
import { FlowSpline } from "./DOM3D/FlowSpline";
import { MachineInfoPanel } from "./DOM3D/MachineInfoPanel";
import { TopPanel } from "./DOM3D/TopPanel";

//------------------------------------------------------------------------------
import { FactoryContext } from "@/contexts/FactoryContext";
import { SelectionContext } from "@/contexts/SelectionContext";

//------------------------------------------------------------------------------
import { isFactory, isArea, isLine, isCell } from "@/core/NavGraph";

//------------------------------------------------------------------------------
import type { AreaNode, CellNode, LineNode } from "@/content/type";
import { NodeTypes } from "@/content/enums";
import { useNavNode } from "../navigation/hooks";
import { FactoryOrderPanel } from "../dashboard/order/FactoryOrderPanel";
import { orders } from "@/content/orders";

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
                if (isArea(selectedNode.parent)) {
                    return selectedNode.parent.lines;
                }
                if (isLine(selectedNode.parent)) {
                    return [];
                }
                return [];
            case NodeTypes.line:
                return selectedNode.parent.lines;
            case NodeTypes.area:
                return selectedNode.lines;
            case NodeTypes.factory:
                return selectedNode.areas.reduce((acc: LineNode[], area) => {
                    acc.push(...area.lines);
                    return acc;
                }, []);
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
            {nodeGraph?.flows.map((flow) => (
                <FlowSpline key={flow.hash} flow={flow} />
            ))}
            {nodeGraph?.areas.map((area) => (
                <AreaBuilderItem key={area.hash} area={area} />
            ))}
            {shownLines.map((line) => (
                <LineBuilderItem key={line.hash} line={line} />
            ))}
            {/* TODO: When factory is selected, show only the cells floors, not the NodeSummary */}
            {shownCells.map((cell) => (
                <CellBuilderItem key={cell.hash} cell={cell} />
            ))}
            {selectedNode && isCell(selectedNode) && selectedNode.machines.length > 0 && (
                <MachineInfoPanel machine={selectedNode.machines[0]} />
            )}
        </>
    );
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const LineBuilderItem = ({ line }: { line: LineNode }) => {
    //--------------------------------------------------------------------------
    // Render
    return (
        <>
            <FloorRegion node={line} />
            <NodeSummary node={line} />
        </>
    );
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const CellBuilderItem = ({ cell }: { cell: CellNode }) => {
    //--------------------------------------------------------------------------
    // Render
    if (isArea(cell.parent)) {
        return (
            <>
                <FloorRegion node={cell} />
                <NodeSummary node={cell} />
            </>
        );
    } else {
        return <FloatingLabel node={cell} />;
    }
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const AreaBuilderItem = ({ area }: { area: AreaNode }) => {
    //--------------------------------------------------------------------------
    // Hooks
    const { isSelected, isChildSelected } = useNavNode(area, "dom3d");

    //--------------------------------------------------------------------------
    // Context
    const { selectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    // Render
    return (
        <>
            <FloorOutline node={area} />
            {(isSelected || isChildSelected) && area.name === "storage" && (
                <div className="pointer-events-none">
                    <AreaStorageOverlay area={area} />
                </div>
            )}
            {isSelected && (
                <AnchoredPanel node={area}>
                    {area.name === "storage" && <AreaStorageQuadPanel />}
                    {!["storage", "reception"].includes(area.name) && (
                        <FactoryOrderPanel order={orders[2]} className="min-w-80" />
                    )}
                </AnchoredPanel>
            )}
            {selectedNode && isFactory(selectedNode) && <TopPanel node={area} />}
        </>
    );
};

export default FactoryBuilder;
