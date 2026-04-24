import { Fragment, useContext, useEffect, useMemo } from "react";

//------------------------------------------------------------------------------
import { FloatingLabel } from "./DOM3D/FloatingLabel";
import { FloorRegion } from "./DOM3D/FloorRegion";
import { FloorOutline } from "./DOM3D/FloorOutline";
import { FlowSpline } from "./DOM3D/FlowSpline";
import { MachineOutline } from "./DOM3D/MachineOutline";
import { MachineLabel } from "./DOM3D/MachineLabel";
import { IncidentInfoPanel } from "./DOM3D/IncidentInfoPanel";

//------------------------------------------------------------------------------
import { FactoryContext } from "@/contexts/FactoryContext";
import { SelectionContext } from "@/contexts/SelectionContext";
import { UseCaseContext } from "@/contexts/UseCaseContext";

//------------------------------------------------------------------------------
import { isFactory, isArea, isLine, isCell } from "@/core/SceneGraph";
import { useTimelineStore } from "@/store/useTimelineStore";
import { downtimeAtAsOf } from "@/components/timeline/timeUtils";

//------------------------------------------------------------------------------
import type { CellNode, LineNode } from "@/content/type";
import { NodeTypes } from "@/content/enums";
import type { UseCaseCellMatcher } from "@/content/useCases";

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
    const home = useTimelineStore((s) => s.home);

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

            .filter((e) => downtimeAtAsOf(e, asOf || home))
            .map((e) => e.workCenterId);
        return nodeList.filter(isCell).filter((n) => currentlyDownCellIds.includes(n.hash));
    }, [span, asOf, home, nodeList]);

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
            {nodeGraph.areas.map((area) => (
                <FloorOutline key={area.hash} node={area} />
            ))}
            {shownLines.map((line) => (
                <FloorRegion key={line.hash} node={line} />
            ))}

            {shownCells.map((cell) => (
                <CellBuilderItem key={cell.hash} cell={cell} />
            ))}
            {selectedNode && isCell(selectedNode) && selectedNode.machines.length > 0 && (
                <>
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
const CellBuilderItem = ({ cell }: { cell: CellNode }) => {
    //--------------------------------------------------------------------------
    // Render
    return <>{isArea(cell.parent) ? <FloorRegion node={cell} /> : <FloatingLabel node={cell} />}</>;
};

export default FactoryBuilder;
