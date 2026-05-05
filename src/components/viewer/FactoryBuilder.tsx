import { useContext, useMemo } from "react";

//------------------------------------------------------------------------------
import { FloatingLabel } from "./DOM3D/FloatingLabel";
import { FloorOutline } from "./DOM3D/FloorOutline";
import { FloorRegion } from "./DOM3D/FloorRegion";
import { FlowSpline } from "./DOM3D/FlowSpline";
import { DowntimeFlag } from "./DOM3D/DowntimeFlag";
import { WorkOrderFlag } from "./DOM3D/WorkOrderFlag";

//------------------------------------------------------------------------------
import { FactoryContext } from "@/contexts/FactoryContext";
import { SelectionContext } from "@/contexts/SelectionContext";

//------------------------------------------------------------------------------
import { isFactory, isArea, isLine, isCell, isMachine } from "@/core/SceneGraph";
import { useTimelineStore } from "@/store/useTimelineStore";
import { downtimeAtAsOf, workOrderAtAsOf } from "@/components/timeline/timeUtils";

//------------------------------------------------------------------------------
import type { CellNode, LineNode, MachineNode } from "@/content/type";
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
    const downtimeCells: { cell: CellNode; downtimeId: string }[] = useMemo(() => {
        if (!span) return [];
        const idByCell = new Map<string, string>();
        for (const e of span.downtimeEvents.values()) {
            if (!downtimeAtAsOf(e, asOf || present)) continue;
            if (!selectedNode) {
                idByCell.set(e.workCenterId, e.id);
                continue;
            }
            switch (selectedNode.type) {
                case NodeTypes.cell:
                    if (selectedNode.hash === e.workCenterId) continue;
                    break;
                case NodeTypes.machine:
                    if (selectedNode.parent.hash === e.workCenterId) continue;
                    break;
                case NodeTypes.aisle:
                case NodeTypes.rack:
                case NodeTypes.bin:
                    continue;
            }
            if (!idByCell.has(e.workCenterId)) idByCell.set(e.workCenterId, e.id);
        }
        return nodeList.filter(isCell).flatMap((n) => {
            const id = idByCell.get(n.hash);
            return id ? [{ cell: n, downtimeId: id }] : [];
        });
    }, [span, asOf, present, nodeList, selectedNode]);

    //--------------------------------------------------------------------------
    const workOrderMachines: { machine: MachineNode; workOrderId: string }[] = useMemo(() => {
        if (!span) return [];
        const idByMachine = new Map<string, string>();
        for (const wo of span.eamWorkOrders.values()) {
            if (!workOrderAtAsOf(wo, asOf || present)) continue;
            if (selectedNode?.type === NodeTypes.machine && selectedNode.hash === wo.assetId) continue;
            if (!idByMachine.has(wo.assetId)) idByMachine.set(wo.assetId, wo.id);
        }
        return nodeList.filter(isMachine).flatMap((n) => {
            const id = idByMachine.get(n.hash);
            return id ? [{ machine: n, workOrderId: id }] : [];
        });
    }, [span, asOf, present, nodeList, selectedNode]);

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
            {downtimeCells.map(({ cell, downtimeId }) => (
                <DowntimeFlag key={cell.hash} cell={cell} downtimeId={downtimeId} />
            ))}
            {workOrderMachines.map(({ machine, workOrderId }) => (
                <WorkOrderFlag key={machine.hash} machine={machine} workOrderId={workOrderId} />
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
