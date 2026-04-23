import { Fragment, useContext, useEffect, useMemo } from "react";

//------------------------------------------------------------------------------
import { StorageAreaSummary } from "@/components/nodes/areas/storage/StorageAreaSummary";
import { StorageAreaOverlay } from "@/components/nodes/areas/storage/StorageAreaOverlay";
import { ProductionAreaSummary } from "@/components/nodes/areas/production/ProductionAreaSummary";
import { ReceptionAreaSummary } from "@/components/nodes/areas/reception/ReceptionAreaSummary";
import { DeliveryAreaSummary } from "@/components/nodes/areas/delivery/DeliveryAreaSummary";

//------------------------------------------------------------------------------
import { FloatingLabel } from "./DOM3D/FloatingLabel";
import { AnchoredPanel } from "./DOM3D/AnchoredPanel";
import { FloorOutline } from "./DOM3D/FloorOutline";
import { FloorRegion } from "./DOM3D/FloorRegion";
import { NodeSummary } from "./DOM3D/NodeSummary";
import { FlowSpline } from "./DOM3D/FlowSpline";
import { MachineOutline } from "./DOM3D/MachineOutline";
import { MachineLabel } from "./DOM3D/MachineLabel";
import { TopPanel } from "./DOM3D/TopPanel";
import { IncidentInfoPanel } from "./DOM3D/IncidentInfoPanel";
import { UnitOutPanel } from "./DOM3D/UnitOutPanel";

//------------------------------------------------------------------------------
import { FactoryContext } from "@/contexts/FactoryContext";
import { SelectionContext } from "@/contexts/SelectionContext";
import { UseCaseContext } from "@/contexts/UseCaseContext";

//------------------------------------------------------------------------------
import { isFactory, isArea, isLine, isCell } from "@/core/NavGraph";
import { useTimelineStore } from "@/store/useTimelineStore";
import { downtimeAtAsOf } from "@/components/timeline/timeUtils";

//------------------------------------------------------------------------------
import type { AreaNode, CellNode, LineNode } from "@/content/type";
import { NodeTypes } from "@/content/enums";
import type { UseCaseCellMatcher } from "@/content/useCases";
import { useNavNode } from "../navigation/hooks";
import { BadgeOEE } from "../common/BadgeOEE";
import { useAreaOEE } from "@/hooks/useAreaOEE";
import { CellInfoPanel } from "./DOM3D/CellInfoPanel";
import { StorageOverlay } from "./overlays/StorageOverlay";

const SHOW_FLOW_LINES = false;

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const normalizedIncludes = (value: string, terms?: string[]) => {
    if (!terms?.length) return true;
    const normalizedValue = value.toLowerCase();
    return terms.some((term) => normalizedValue.includes(term.toLowerCase()));
};

const matchesCellMatcher = (cell: CellNode, matcher: UseCaseCellMatcher) => {
    const parentLineName = isLine(cell.parent) ? cell.parent.name : "";
    const machineNames = cell.machines.map((machine) => machine.name);

    return (
        normalizedIncludes(parentLineName, matcher.lineNameIncludes) &&
        normalizedIncludes(cell.name, matcher.cellNameIncludes) &&
        (!matcher.machineNameIncludes?.length ||
            machineNames.some((machineName) => normalizedIncludes(machineName, matcher.machineNameIncludes)))
    );
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const FactoryBuilder = () => {
    //--------------------------------------------------------------------------
    // Context
    const { nodeGraph, nodeList } = useContext(FactoryContext);
    const { selectedNode, setSelectedNode } = useContext(SelectionContext);
    const { activeUseCaseId, useCases, pendingIncidentFocusUseCaseId, clearIncidentFocusRequest } =
        useContext(UseCaseContext);

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

    const simulatedIncidentCells: CellNode[] = useMemo(() => {
        if (!activeUseCaseId) return [];
        const useCase = useCases[activeUseCaseId];
        if (!useCase) return [];
        return nodeList
            .filter(isCell)
            .filter(
                (cell) =>
                    useCase?.simulatedDowntimeCellMatchers?.some((matcher) => matchesCellMatcher(cell, matcher)) ??
                    false,
            );
    }, [activeUseCaseId, useCases, nodeList]);

    const incidentCells: CellNode[] = useMemo(() => {
        return [...downtimeCells, ...simulatedIncidentCells].reduce((acc: CellNode[], cell) => {
            if (acc.some((item) => item.hash === cell.hash)) return acc;
            acc.push(cell);
            return acc;
        }, []);
    }, [downtimeCells, simulatedIncidentCells]);

    useEffect(() => {
        if (!activeUseCaseId || pendingIncidentFocusUseCaseId !== activeUseCaseId) return;
        if (!simulatedIncidentCells.length) return;

        setSelectedNode(simulatedIncidentCells[0]);
        clearIncidentFocusRequest();
    }, [
        activeUseCaseId,
        pendingIncidentFocusUseCaseId,
        simulatedIncidentCells,
        setSelectedNode,
        clearIncidentFocusRequest,
    ]);

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
            {shownCells.map((cell, index) => (
                <CellBuilderItem key={cell.hash} cell={cell} index={index} />
            ))}
            {selectedNode && isCell(selectedNode) && selectedNode.machines.length > 0 && (
                <>
                    <CellInfoPanel cell={selectedNode} />

                    {selectedNode.machines.map((machine) => (
                        <Fragment key={machine.hash}>
                            <MachineOutline machine={machine} />
                            <MachineLabel machine={machine} />
                        </Fragment>
                    ))}
                </>
            )}
            {incidentCells.map((cell) => (
                <IncidentInfoPanel key={cell.hash} cell={cell} />
            ))}
        </>
    );
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const LineBuilderItem = ({ line }: { line: LineNode }) => {
    //--------------------------------------------------------------------------
    // Context
    const { selectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    // Render
    return (
        <>
            <FloorRegion node={line} />
            {selectedNode && isArea(selectedNode) && <NodeSummary node={line} />}
        </>
    );
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const CellBuilderItem = ({ cell, index }: { cell: CellNode; index: number }) => {
    //--------------------------------------------------------------------------
    // Context
    const { selectedNode } = useContext(SelectionContext);

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
                    {selectedNode && isArea(selectedNode) && <NodeSummary node={cell} />}
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
    const kpi = useMemo(() => {
        if (oee === undefined) return;
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
            case "reception":
                return <ReceptionAreaSummary />;
            case "storage":
                return <StorageAreaSummary areaNode={area} />;
            case "supply":
                return; // TODO
            case "production":
                return <ProductionAreaSummary className="min-w-80" />;
            case "control":
                return; //TODO
            case "delivery":
                return <DeliveryAreaSummary areaNode={area} />;
        }
    }, [area, isSelected]);

    //--------------------------------------------------------------------------
    const areaAddOn = useMemo(() => {
        switch (area.name) {
            case "storage":
                return;
                return (
                    <div className="pointer-events-none">
                        <StorageAreaOverlay area={area} />
                    </div>
                );
        }
    }, [area]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <>
            <FloorOutline node={area} />
            {selectedNode && isFactory(selectedNode) && <TopPanel node={area} />}
            {isSelected &&
                selectedNode &&
                isArea(selectedNode) &&
                ["storage", "delivery"].includes(selectedNode.name) && <StorageOverlay areaNode={selectedNode} />}
            {isSelected && (
                <>
                    <AnchoredPanel node={area} className="pointer-events-none!" kpi={kpi}>
                        {areaSummary}
                    </AnchoredPanel>
                    {areaAddOn}
                </>
            )}
        </>
    );
};

export default FactoryBuilder;
