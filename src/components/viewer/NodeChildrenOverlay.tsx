import { useContext, useMemo } from "react";

//------------------------------------------------------------------------------
import { NodeSummary } from "./DOM3D/NodeSummary";
import { TopPanel } from "./DOM3D/TopPanel";
import { UnitOutPanel } from "./DOM3D/UnitOutPanel";
import { MachineLabel } from "./DOM3D/MachineLabel";
import { MachineOutline } from "./DOM3D/MachineOutline";
import { WorkOrderFlag } from "./DOM3D/WorkOrderFlag";
import { DowntimeFlag } from "./DOM3D/DowntimeFlag";

//------------------------------------------------------------------------------
import { useTimelineStore } from "@/store/useTimelineStore";
import { isCell, isMachine } from "@/core/SceneGraph";
import { downtimeAtAsOf, workOrderAtAsOf } from "../timeline/timeUtils";

//------------------------------------------------------------------------------
import { FactoryContext } from "@/contexts/FactoryContext";
import { SelectionContext } from "@/contexts/SelectionContext";

//------------------------------------------------------------------------------
import { NodeTypes } from "@/content/enums";
import type { AreaNode, CellNode, FactoryNode, LineNode, MachineNode, SceneGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const NodeChildrensOverlay = ({ node }: { node: SceneGraphNode }) => {
    switch (node.type) {
        case NodeTypes.factory:
            return <FactoryChildrensOverlay factoryNode={node} />;
        case NodeTypes.area:
            return <AreaChildrensOverlay areaNode={node} />;
        case NodeTypes.line:
            return;
        case NodeTypes.cell:
            return <CellChildrensOverlay cellNode={node} />;
        case NodeTypes.machine:
            return;
        case NodeTypes.aisle:
            return;
        case NodeTypes.rack:
            return;
        case NodeTypes.bin:
            return;
    }
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const FactoryChildrensOverlay = ({ factoryNode }: { factoryNode: FactoryNode }) => {
    //--------------------------------------------------------------------------
    // Context
    const { nodeList } = useContext(FactoryContext);
    const { selectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    const span = useTimelineStore((s) => s.span);
    const asOf = useTimelineStore((s) => s.asOf);
    const present = useTimelineStore((s) => s.present);

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
    return (
        <>
            {factoryNode.areas.map((areaNode) => (
                <TopPanel key={areaNode.hash} node={areaNode} />
            ))}
            {downtimeCells.map(({ cell, downtimeId }) => (
                <DowntimeFlag key={cell.hash} cell={cell} downtimeId={downtimeId} />
            ))}
            {workOrderMachines.map(({ machine, workOrderId }) => (
                <WorkOrderFlag key={machine.hash} machine={machine} workOrderId={workOrderId} />
            ))}
        </>
    );
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const AreaChildrensOverlay = ({ areaNode }: { areaNode: AreaNode }) => {
    return (
        <>
            {areaNode.lines.map((lineNode) => (
                <NodeSummary node={lineNode} key={lineNode.hash} />
            ))}
            {areaNode.cells.map((cellNode) => (
                <NodeSummary node={cellNode} key={cellNode.hash} />
            ))}
            {areaNode.cells.flatMap((cellNode) =>
                cellNode.outputs.map((out, index) => (
                    <UnitOutPanel key={out.hash} outNode={out} unitCompleted={96} unitTotal={952} delay={index} />
                )),
            )}
        </>
    );
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const LineChildrensOverlay = ({ lineNode }: { lineNode: LineNode }) => {
    {
        lineNode.cells.map((cellNode) => <NodeSummary node={cellNode} key={cellNode.hash} />);
    }
    {
        lineNode.cells.flatMap((cellNode, index) =>
            cellNode.outputs.map((out) => (
                <UnitOutPanel key={out.hash} outNode={out} unitCompleted={96} unitTotal={952} delay={index} />
            )),
        );
    }
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const CellChildrensOverlay = ({ cellNode }: { cellNode: CellNode }) => {
    return (
        <>
            {cellNode.machines.map((machine) => (
                <MachineLabel key={machine.hash} machine={machine} />
            ))}
            {cellNode.machines.map((machine) => (
                <MachineOutline key={machine.hash} machine={machine} />
            ))}
        </>
    );
};
