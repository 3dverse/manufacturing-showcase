import { useContext, useMemo } from "react";

//------------------------------------------------------------------------------
import { StorageAreaSummary } from "@/components/nodes/areas/storage/StorageAreaSummary";
import { StorageAreaOverlay } from "@/components/nodes/areas/storage/StorageAreaOverlay";
import { ProductionAreaSummary } from "@/components/nodes/areas/production/ProductionAreaSummary";

//------------------------------------------------------------------------------
import { FloatingLabel } from "./DOM3D/FloatingLabel";
import { AnchoredPanel } from "./DOM3D/AnchoredPanel";
import { FloorOutline } from "./DOM3D/FloorOutline";
import { FloorRegion } from "./DOM3D/FloorRegion";
import { NodeSummary } from "./DOM3D/NodeSummary";
import { FlowSpline } from "./DOM3D/FlowSpline";
import { MachineInfoPanel } from "./DOM3D/MachineInfoPanel";
import { MachineOutline } from "./DOM3D/MachineOutline";
import { MachineLabel } from "./DOM3D/MachineLabel";
import { TopPanel } from "./DOM3D/TopPanel";
import { IncidentInfoPanel } from "./DOM3D/IncidentInfoPanel";
import { UnitOutPanel } from "./DOM3D/UnitOutPanel";

//------------------------------------------------------------------------------
import { FactoryContext } from "@/contexts/FactoryContext";
import { SelectionContext } from "@/contexts/SelectionContext";

//------------------------------------------------------------------------------
import { isFactory, isArea, isLine, isCell } from "@/core/NavGraph";
import { useTimelineStore } from "@/store/useTimelineStore";
import { downtimeAtAsOf } from "@/components/timeline/timeUtils";

//------------------------------------------------------------------------------
import type { AreaNode, CellNode, LineNode } from "@/content/type";
import { NodeTypes } from "@/content/enums";
import { useNavNode } from "../navigation/hooks";
import { BadgeOEE } from "../common/BadgeOEE";
import { useAreaOEE } from "@/hooks/useAreaOEE";

const SHOW_FLOW_LINES = false;

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const FactoryBuilder = () => {
    //--------------------------------------------------------------------------
    // Context
    const { nodeGraph, nodeList } = useContext(FactoryContext);
    const { selectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    const span = useTimelineStore((s) => s.span);
    const asOf = useTimelineStore((s) => s.asOf);

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
            case NodeTypes.cell:
                return [selectedNode];
            default:
                return [];
        }
    }, [selectedNode]);

    //--------------------------------------------------------------------------
    const downtimeCells: CellNode[] = useMemo(() => {
        if (!span) return [];
        const currentlyDownCellIds = [...span.downtimeEvents.values()]

            .filter((e) => downtimeAtAsOf(e, asOf))
            .map((e) => e.workCenterId);
        return nodeList.filter(isCell).filter((n) => currentlyDownCellIds.includes(n.hash));
    }, [span, asOf, nodeList]);

    //--------------------------------------------------------------------------
    // Render
    // Note: Always render Area and its children (Line/Cell) + flows
    // Show children nodes for selected Line
    return (
        <>
            {SHOW_FLOW_LINES &&
                selectedNode &&
                isFactory(selectedNode) &&
                nodeGraph?.flows.map((flow) => <FlowSpline key={flow.hash} flow={flow} />)}
            {nodeGraph?.areas.map((area) => (
                <AreaBuilderItem key={area.hash} area={area} />
            ))}
            {shownLines.map((line) => (
                <LineBuilderItem key={line.hash} line={line} />
            ))}
            {/* TODO: When factory is selected, show only the cells floors, not the NodeSummary */}
            {shownCells.map((cell, index) => (
                <CellBuilderItem key={cell.hash} cell={cell} index={index} />
            ))}
            {selectedNode && isCell(selectedNode) && selectedNode.machines.length > 0 && (
                <>
                    <MachineInfoPanel machine={selectedNode.machines[0]} />
                    <MachineOutline machine={selectedNode.machines[0]} />
                    <MachineLabel machine={selectedNode.machines[0]} />
                </>
            )}
            {downtimeCells.map((cell) => (
                <IncidentInfoPanel key={cell.hash} cell={cell} />
            ))}
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
const CellBuilderItem = ({ cell, index }: { cell: CellNode; index: number }) => {
    //--------------------------------------------------------------------------
    // Render
    return (
        <>
            {cell.out.map((out) => (
                <UnitOutPanel key={out.euid.value} outEntity={out} unitCompleted={96} unitTotal={952} delay={index} />
            ))}
            {isArea(cell.parent) ? (
                <>
                    <FloorRegion node={cell} />
                    <NodeSummary node={cell} />
                </>
            ) : (
                <FloatingLabel node={cell} />
            )}
        </>
    );
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const AreaBuilderItem = ({ area }: { area: AreaNode }) => {
    //--------------------------------------------------------------------------
    // Hooks
    const { isSelected } = useNavNode(area, "dom3d");

    //--------------------------------------------------------------------------
    // Context
    const { selectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    // Hooks
    const oee = useAreaOEE(area);

    //--------------------------------------------------------------------------
    // Memos
    const kpi = useMemo(() => {
        if (oee === null) return null;
        return (
            <div className="starting:opacity-0 starting:translate-y-4 opacity-100 translate-y-0 transition-all duration-300 delay-1700 transform-3d">
                <BadgeOEE
                    oee={oee}
                    className="text-2xl -translate-y-8 px-3 py-2 shadow-xl transform-3d backdrop-blur-3xl"
                />
            </div>
        );
    }, [oee]);

    //--------------------------------------------------------------------------
    const areaSummary = useMemo(() => {
        if (!isSelected) return;
        switch (area.name) {
            case "storage":
                return <StorageAreaSummary />;
            case "production":
                return <ProductionAreaSummary className="min-w-80" />;
            case "reception":
                return; //TODO
            case "supply":
                return; //TODO
            case "control":
                return; //TODO
            case "delivery":
                return; //TODO
        }
    }, [area.name]);

    //--------------------------------------------------------------------------
    const areaAddOn = useMemo(() => {
        switch (area.name) {
            case "storage":
                return (
                    <div className="pointer-events-none">
                        <StorageAreaOverlay area={area} />
                    </div>
                );
        }
    }, []);

    //--------------------------------------------------------------------------

    //--------------------------------------------------------------------------
    // Render
    return (
        <>
            <FloorOutline node={area} />

            <AnchoredPanel node={area} className="pointer-events-none!" kpi={kpi}>
                {areaSummary}
            </AnchoredPanel>
            {areaAddOn}
            {selectedNode && isFactory(selectedNode) && <TopPanel node={area} />}
        </>
    );
};

export default FactoryBuilder;
