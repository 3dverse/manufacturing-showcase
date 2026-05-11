import { useMemo, useState } from "react";

//------------------------------------------------------------------------------
import { ReceptionAreaSummary } from "../nodes/areas/reception/ReceptionAreaSummary";
import { StorageAreaSummary } from "../nodes/areas/storage/StorageAreaSummary";
import { ProductionAreaSummary } from "../nodes/areas/production/ProductionAreaSummary";
import { DeliveryAreaSummary } from "../nodes/areas/delivery/DeliveryAreaSummary";
import { CellIncident } from "../nodes/cells/CellIncident";

//------------------------------------------------------------------------------
import { NodeTypes } from "@/content/enums";
import { cn } from "@/utils/cn";
import { useAreaOEE } from "@/hooks/useAreaOEE";
import { BadgeOEE } from "../common/BadgeOEE";
import {
    activeDowntimesAt,
    activeWorkOrdersAt,
    downtimeAtAsOf,
    workOrderAtAsOf,
} from "@/components/timeline/timeUtils";
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
import { useFocusStore } from "@/store/useFocusStore";

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
    //const oeeHistory = useOEEHistory(areaNode);
    const oeeHistory = undefined;
    const span = useTimelineStore((s) => s.span);
    const asOf = useTimelineStore((s) => s.asOf);
    const present = useTimelineStore((s) => s.present);

    //--------------------------------------------------------------------------
    const areaCellHashes = useMemo(() => {
        const allCells = [...areaNode.lines.flatMap((l) => l.cells), ...areaNode.cells];
        return new Set(allCells.map((c) => c.hash));
    }, [areaNode]);

    const areaMachineHashes = useMemo(() => {
        const allCells = [...areaNode.lines.flatMap((l) => l.cells), ...areaNode.cells];
        return new Set(allCells.flatMap((c) => c.machines.map((m) => m.hash)));
    }, [areaNode]);

    const hasAreaStoppage = useMemo(() => {
        if (!span) return false;
        const t = asOf || present;
        return (
            activeDowntimesAt(span, t).some((dt) => areaCellHashes.has(dt.workCenterId)) ||
            activeWorkOrdersAt(span, t).some((wo) => areaMachineHashes.has(wo.assetId))
        );
    }, [span, asOf, present, areaCellHashes, areaMachineHashes]);

    //--------------------------------------------------------------------------
    const kpi = useMemo(() => {
        if (oee === undefined) return;
        return (
            <div
                title={`OEE — "last 7 days"`}
                className="starting:opacity-0 starting:translate-y-4 opacity-100 translate-y-0 transition-all duration-300 delay-1700 transform-3d"
            >
                <div className="relative -translate-y-8">
                    <BadgeOEE
                        oee={oee}
                        oeeHistory={oeeHistory}
                        hasStoppage={hasAreaStoppage}
                        className="text-2xl px-3 py-2 shadow-xl transform-3d backdrop-blur-3xl"
                    />
                    <span
                        className={cn(
                            "absolute bottom-0.5 right-1 text-[10px] leading-none",
                            hasAreaStoppage ? "text-warning-400" : "text-positive-400",
                        )}
                    >
                        7d
                    </span>
                </div>
            </div>
        );
    }, [oee, oeeHistory, hasAreaStoppage]);

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
    //--------------------------------------------------------------------------
    // Render
    return (
        <>
            {lineNode.cells.flatMap((cell) =>
                cell.outputs.map((out, cellIndex) => (
                    <UnitOutPanel key={out.hash} outNode={out} unitCompleted={96} unitTotal={952} delay={cellIndex} />
                )),
            )}
        </>
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
    const { selected } = useFocusStore();
    const asOf = useTimelineStore((t) => t.asOf);
    const present = useTimelineStore((t) => t.present);
    const span = useTimelineStore((t) => t.span);
    const targetAsOf = asOf || present;

    const snapshot = useSpanSnapshot();

    //--------------------------------------------------------------------------
    // Memos
    const hasStoppage = useMemo(() => {
        if (!span) return false;
        const t = asOf || present;
        return (
            [...span.downtimeEvents.values()].some((e) => e.workCenterId === cellNode.hash && downtimeAtAsOf(e, t)) ||
            [...span.eamWorkOrders.values()].some(
                (wo) => cellNode.machines.some((m) => m.hash === wo.assetId) && workOrderAtAsOf(wo, t),
            )
        );
    }, [span, asOf, present, cellNode]);

    //--------------------------------------------------------------------------
    // Find the current raw operation for this cell (time-dependent lookup on raw data)
    const rawOperation = useMemo(() => {
        return (
            snapshot?.operations
                .filter((op) => op.workCenterId === cellNode.hash && op.actualStart && op.actualStart < targetAsOf)
                .sort((a, b) => (a.actualStart || 0) - (b.actualStart || 0))
                .pop() ?? null
        );
    }, [snapshot, cellNode, targetAsOf]);

    //--------------------------------------------------------------------------
    const focused = useMemo(
        () => (rawOperation ? { type: "operation" as const, id: rawOperation.id } : null),
        [rawOperation],
    );

    //--------------------------------------------------------------------------
    const correlated = useCorrelation(snapshot, focused);

    //--------------------------------------------------------------------------
    // Project only the focused operation and its correlated entities
    const correlatedSnapshot = useMemo(
        () => (snapshot && focused && correlated ? buildCorrelatedSnapshot(snapshot, focused, correlated) : null),
        [snapshot, focused, correlated],
    );

    //--------------------------------------------------------------------------
    const projection = useProjection(correlatedSnapshot);

    //--------------------------------------------------------------------------
    const operation = projection?.operations.find((op) => op.id === rawOperation?.id);

    //--------------------------------------------------------------------------
    const operationDowntime = useMemo(() => {
        return projection?.downtimeEvents
            .filter(
                (d) =>
                    d.workCenterId === cellNode.hash && d.startedAt < targetAsOf && d.endedAt && d.endedAt > targetAsOf,
            )
            .pop();
    }, [cellNode, projection, targetAsOf]);

    //--------------------------------------------------------------------------
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
        return (
            operationDowntime &&
            operationDowntime.id !== selected?.id && <CellIncident downtimeEvent={operationDowntime} />
        );
    }, [operationDowntime, selected]);

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
                    hasStoppage={hasStoppage}
                />
            </InfoPanel>
            {outs}
        </>
    );
};
