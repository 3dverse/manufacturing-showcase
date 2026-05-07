import { useMemo, useState } from "react";

//------------------------------------------------------------------------------
import { ReceptionAreaSummary } from "../nodes/areas/reception/ReceptionAreaSummary";
import { StorageAreaSummary } from "../nodes/areas/storage/StorageAreaSummary";
import { ProductionAreaSummary } from "../nodes/areas/production/ProductionAreaSummary";
import { DeliveryAreaSummary } from "../nodes/areas/delivery/DeliveryAreaSummary";
import { CellIncident } from "../nodes/cells/CellIncident";

//------------------------------------------------------------------------------
import { NodeTypes } from "@/content/enums";
import { useAreaOEE } from "@/hooks/useAreaOEE";
import { useOEEHistory } from "@/hooks/useOEEHistory";
import { BadgeOEE } from "../common/BadgeOEE";
import { AnchoredPanel } from "./DOM3D/AnchoredPanel";
import { StorageOverlay } from "./StorageOverlay";
import { UnitOutPanel } from "./DOM3D/UnitOutPanel";
import { InfoPanel } from "./DOM3D/InfoPanel";
import { CellSummary } from "../nodes/cells/CellSummary";
import { useSpanSnapshot } from "@/hooks/useSpanSnapshot";
import { useProjection } from "@/hooks/useProjection";
import { useCorrelation } from "@/hooks/useCorrelation";
import { buildCorrelatedSnapshot } from "@/core/Correlation";
import { getMachineDocumentation } from "@/content/machine";

//------------------------------------------------------------------------------
import type { AreaNode, CellNode, LineNode, SceneGraphNode } from "@/content/type";
import { useTimelineStore } from "@/store/useTimelineStore";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const NodeDetailsOverlay = ({ node }: { node: SceneGraphNode }) => {
    //--------------------------------------------------------------------------
    switch (node.type) {
        case NodeTypes.factory:
            return;
        case NodeTypes.area:
            return <AreaDetailsOverlay areaNode={node} />;
        case NodeTypes.line:
            return <LineDetails lineNode={node} />;
        case NodeTypes.cell:
            return <CellDetails cellNode={node} />;
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
const AreaDetailsOverlay = ({ areaNode }: { areaNode: AreaNode }) => {
    //--------------------------------------------------------------------------
    // Hooks
    const oee = useAreaOEE(areaNode);
    const oeeHistory = useOEEHistory(areaNode);

    //--------------------------------------------------------------------------
    const kpi = useMemo(() => {
        if (oee === undefined) return;
        return (
            <div className="starting:opacity-0 starting:translate-y-4 opacity-100 translate-y-0 transition-all duration-300 delay-1700 transform-3d">
                <BadgeOEE
                    oee={oee}
                    oeeHistory={oeeHistory}
                    className="text-2xl -translate-y-8 px-3 py-2 shadow-xl transform-3d backdrop-blur-3xl"
                />
            </div>
        );
    }, [oee, oeeHistory]);

    //--------------------------------------------------------------------------
    const content = useMemo(() => {
        switch (areaNode.name) {
            case "reception":
                return <ReceptionAreaSummary />;
            case "storage":
                return <StorageAreaSummary areaNode={areaNode} />;
            case "supply":
                return; // TODO
            case "production":
                return <ProductionAreaSummary className="min-w-80" />;
            case "control":
                return; //TODO
            case "delivery":
                return <DeliveryAreaSummary areaNode={areaNode} />;
            default:
                return;
        }
    }, [areaNode]);

    //--------------------------------------------------------------------------
    const addOn = useMemo(() => {
        if (["storage", "delivery"].includes(areaNode.name)) {
            return <StorageOverlay areaNode={areaNode} />;
        }
    }, [areaNode]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <>
            <AnchoredPanel node={areaNode} badge={kpi} interactive={false}>
                {content}
            </AnchoredPanel>
            {addOn}
        </>
    );
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const LineDetails = ({ lineNode }: { lineNode: LineNode }) => {
    return lineNode.cells.flatMap((cell) =>
        cell.outputs.map((out, cellIndex) => (
            <UnitOutPanel key={out.hash} outNode={out} unitCompleted={96} unitTotal={952} delay={cellIndex} />
        )),
    );
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const URL = "https://explorer-test.productys.com/?zoom_level=20&dashboard_id=168";
const CellDetails = ({ cellNode }: { cellNode: CellNode }) => {
    //--------------------------------------------------------------------------
    // State
    const [isMESDashboardVisible] = useState(false);

    //--------------------------------------------------------------------------
    const asOf = useTimelineStore((t) => t.asOf);
    const present = useTimelineStore((t) => t.present);
    const targetAsOf = asOf || present;

    const snapshot = useSpanSnapshot();

    // Find the current raw operation for this cell (time-dependent lookup on raw data)
    const rawOperation = useMemo(() => {
        return (
            snapshot?.operations
                .filter((op) => op.workCenterId === cellNode.hash && op.actualStart && op.actualStart < targetAsOf)
                .sort((a, b) => (a.actualStart || 0) - (b.actualStart || 0))
                .pop() ?? null
        );
    }, [snapshot, cellNode, targetAsOf]);

    const focused = useMemo(
        () => (rawOperation ? { type: "operation" as const, id: rawOperation.id } : null),
        [rawOperation],
    );
    const correlated = useCorrelation(snapshot, focused);

    // Project only the focused operation and its correlated entities
    const correlatedSnapshot = useMemo(
        () => (snapshot && focused && correlated ? buildCorrelatedSnapshot(snapshot, focused, correlated) : null),
        [snapshot, focused, correlated],
    );
    const projection = useProjection(correlatedSnapshot);

    const operation = projection?.operations.find((op) => op.id === rawOperation?.id);
    const operationDowntime = useMemo(() => {
        return projection?.downtimeEvents
            .filter((d) => d.workCenterId === cellNode.hash && d.startedAt < targetAsOf)
            .sort((a, b) => a.startedAt - b.startedAt)
            .pop();
    }, [cellNode, projection, targetAsOf]);
    const productionOrderId = correlated?.productionOrders.values().next().value;
    const productionOrder = projection?.productionOrders.find((po) => po.id === productionOrderId);
    const machineDetails = getMachineDocumentation(cellNode.machines[0].name);

    //--------------------------------------------------------------------------
    // Memos
    const outs = useMemo(() => {
        return cellNode.outputs.map((out, index) => (
            <UnitOutPanel key={out.hash} outNode={out} unitCompleted={96} unitTotal={952} delay={index} />
        ));
    }, [cellNode]);

    //--------------------------------------------------------------------------
    const downtime = useMemo(() => {
        return operationDowntime && <CellIncident downtimeEvent={operationDowntime} />;
    }, [operationDowntime]);

    //--------------------------------------------------------------------------
    const extra = useMemo(() => {
        if (!isMESDashboardVisible) return;
        return (
            <div className="absolute top-1/2 left-1/2 z-10 w-90 h-full starting:opacity-0 starting:-translate-x-[80%] opacity-100 -translate-y-1/2 -translate-x-full transition-all duration-300 hover:scale-105 hover:-translate-z-[.25px]">
                <iframe src={URL} className="w-full h-full" />
            </div>
        );
    }, [isMESDashboardVisible]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <>
            <InfoPanel node={cellNode} warning={downtime} extra={extra}>
                <CellSummary
                    cell={cellNode}
                    manufacturingOrder={productionOrder}
                    operation={operation}
                    machineDetails={machineDetails}
                />
            </InfoPanel>
            {outs}
        </>
    );
};
