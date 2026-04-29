import { useContext, useMemo } from "react";

//------------------------------------------------------------------------------
import { FloatingLabel } from "./DOM3D/FloatingLabel";
import { FloorOutline } from "./DOM3D/FloorOutline";
import { FloorRegion } from "./DOM3D/FloorRegion";
import { FlowSpline } from "./DOM3D/FlowSpline";
import { IncidentInfoPanel } from "./DOM3D/IncidentInfoPanel";

//------------------------------------------------------------------------------
import { FactoryContext } from "@/contexts/FactoryContext";
import { SelectionContext } from "@/contexts/SelectionContext";

//------------------------------------------------------------------------------
import { isFactory, isArea, isLine, isCell } from "@/core/SceneGraph";
import { useTimelineStore } from "@/store/useTimelineStore";
import { downtimeAtAsOf } from "@/components/timeline/timeUtils";

//------------------------------------------------------------------------------
import type { CellNode, LineNode } from "@/content/type";
import { NodeTypes } from "@/content/enums";

//------------------------------------------------------------------------------
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
    const present = useTimelineStore((s) => s.present);

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
                return [];
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

            .filter((e) => downtimeAtAsOf(e, asOf || present))
            .map((e) => e.workCenterId);
        return nodeList.filter(isCell).filter((n) => currentlyDownCellIds.includes(n.hash));
    }, [span, asOf, present, nodeList]);

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
            {downtimeCells.map((cell) => (
                <IncidentInfoPanel key={cell.hash} cell={cell} />
            ))}
            {shownCells.map((cell) =>
                isArea(cell.parent) ? (
                    <FloorRegion key={cell.hash} node={cell} />
                ) : (
                    <FloatingLabel key={cell.hash} node={cell} />
                ),
            )}
        </>
    );
};

export default FactoryBuilder;
