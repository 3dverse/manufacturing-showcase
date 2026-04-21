//------------------------------------------------------------------------------
import { useContext, useMemo, useState } from "react";
import { BoundingBoxFaceProjection } from "@3dverse/livelink-react-ui";
import { faChartLine, faCheckToSlot, faFilePdf } from "@fortawesome/sharp-regular-svg-icons";
import { faExclamationTriangle } from "@fortawesome/sharp-solid-svg-icons";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";
import Button from "@/components/common/Button";
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { PanelTitle, PanelWrapper } from "@/components/common/panel";
import { DataContainer, DataLabel, DataValue } from "@/components/common/panel/DataLabel";
import { Triangle } from "@/components/common/icons/Triangle";

//------------------------------------------------------------------------------
import { useSpanProjection } from "@/hooks/useSpanProjection";
import { useCorrelation } from "@/hooks/useCorrelation";
import { useIsIncidentCell } from "@/hooks/useIsIncidentCell";
import { UseCaseContext } from "@/contexts/UseCaseContext";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";
import { fmtDuration } from "@/utils/helpers-time";
import { generateIncidentReport } from "@/utils/generateIncidentReport";

//------------------------------------------------------------------------------
import { getMachineDocumentation } from "@/content/machine";
import type { CellNode } from "@/content/type";

//------------------------------------------------------------------------------
const URL = "https://explorer-test.productys.com/?zoom_level=20&dashboard_id=168";

//------------------------------------------------------------------------------
export function CellInfoPanel({ cell }: { cell: CellNode }) {
    //--------------------------------------------------------------------------
    const [isMESDashboardVisible, setIsMESDashboardVisible] = useState(false);
    const { activeUseCaseId, useCases } = useContext(UseCaseContext);

    //--------------------------------------------------------------------------
    const projection = useSpanProjection();

    // Step 1: find the active operation for this cell, or the last completed one.
    const { focusedOperation, isLastOperation } = useMemo(() => {
        if (!projection) return { focusedOperation: null, isLastOperation: false };

        const cellOps = projection.operations.filter((op) => op.workCenterId === cell.hash);

        const active = cellOps.find((op) => op.phase === "active");
        if (active) return { focusedOperation: active, isLastOperation: false };

        const lastCompleted =
            cellOps.filter((op) => op.phase === "completed").sort((a, b) => b.effectiveEnd - a.effectiveEnd)[0] ?? null;

        return { focusedOperation: lastCompleted, isLastOperation: lastCompleted !== null };
    }, [projection, cell.hash]);

    // Step 2: build a correlated set from the focused operation.
    const focused = useMemo(
        () => (focusedOperation ? { type: "operation" as const, id: focusedOperation.id } : null),
        [focusedOperation],
    );
    const correlated = useCorrelation(projection, focused);

    // Step 3: resolve production order from the correlated set.
    const { productionOrder, isLastProductionOrder } = useMemo(() => {
        if (!projection || !correlated) return { productionOrder: null, isLastProductionOrder: false };

        const pos = projection.productionOrders.filter((po) => correlated.productionOrders.has(po.id));

        const active = pos.find((po) => po.phase === "active");
        if (active) return { productionOrder: active, isLastProductionOrder: false };

        const lastCompleted =
            pos.filter((po) => po.phase === "completed").sort((a, b) => b.effectiveEnd - a.effectiveEnd)[0] ?? null;

        return { productionOrder: lastCompleted, isLastProductionOrder: lastCompleted !== null };
    }, [projection, correlated]);

    // Incidents: any correlated downtime that is currently ongoing.
    const incidentDowntimes = useMemo(() => {
        if (!projection || !correlated || correlated.downtimeEvents.size === 0) return [];
        return projection.downtimeEvents.filter((d) => correlated.downtimeEvents.has(d.id) && d.isOngoing);
    }, [projection, correlated]);

    const isSimulatedIncidentCell = useIsIncidentCell(cell);
    const hasIncident = incidentDowntimes.length > 0 || isSimulatedIncidentCell;
    const incidentMessage =
        (activeUseCaseId && useCases[activeUseCaseId]?.salesOrderIncident?.warningMessage) || undefined;

    //--------------------------------------------------------------------------
    const { orderNumber, itemCode } = productionOrder ?? { orderNumber: "", itemCode: "" };
    const { goodQuantity = 0, scrapQuantity = 0 } = focusedOperation?.quantities ?? {};
    const machineDetails = getMachineDocumentation(cell.name);

    const quality =
        goodQuantity + scrapQuantity > 0
            ? Number((goodQuantity / (goodQuantity + scrapQuantity)) * 100).toFixed(0)
            : undefined;

    const oee = useMemo(() => {
        if (!focusedOperation) return undefined;
        return Math.round((goodQuantity / (goodQuantity + scrapQuantity)) * 100);
    }, [focusedOperation, goodQuantity, scrapQuantity]);

    //--------------------------------------------------------------------------
    if (!productionOrder) return null;
    return (
        <BoundingBoxFaceProjection
            entity={cell.entity}
            face="right"
            className="flex flex-col justify-end gap-3 transform-3d pointer-events-none"
        >
            {hasIncident && (
                <>
                    <ViewerPanel className="transform-[translateZ(-.1px)] relative min-w-80 bg-warning-500 shadow-[0_-4px_56px_-1px_var(--color-warning-500)] [corner-shape:bevel] starting:opacity-0 starting:translate-y-8 opacity-100 translate-y-0 translate-x-[80%] transition-all duration-400 delay-500 transform-3d">
                        <PanelWrapper className="py-2 flex justify-between items-center gap-8 transform-3d">
                            <PanelTitle className="capitalize text-warning-100">
                                <p>
                                    <Icon icon={faExclamationTriangle} className="mr-2 text-sm text-warning-100" />
                                    <span className="font-semibold">Incident reported</span>
                                </p>
                                <p className="text-sm mt-1">{incidentMessage}</p>
                            </PanelTitle>
                            <div className="transform-3d shrink-0 bg-warning-800 rounded-md">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="button bg-warning-100 text-warning-600 hover:bg-warning-50 border-0 -translate-z-[.1px] hover:translate-z-0"
                                    onClick={() =>
                                        generateIncidentReport({
                                            downtime: incidentDowntimes[0],
                                            machineName: machineDetails.name,
                                            workCenterId: cell.hash,
                                            productionOrder: productionOrder,
                                            operation: focusedOperation,
                                        })
                                    }
                                >
                                    <Icon icon={faFilePdf} className="mr-2 text-sm" />
                                    Read the report
                                </Button>
                            </div>
                        </PanelWrapper>
                    </ViewerPanel>
                </>
            )}
            <ViewerPanel className="min-w-80 rounded-xl border-2 border-slate-0/50 shadow-lg [corner-shape:bevel] [outline:2px_solid_#ffffff90] outline-offset-2 translate-x-[80%] starting:translate-x-[60%] transition-transform duration-400">
                <PanelWrapper className="py-3 px-2 space-y-3">
                    <p className="px-2 capitalize text-sm font-semibold text-slate-800 border-b border-slate-200/80 pb-2">
                        {machineDetails.name}
                    </p>

                    <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2">
                            <DataContainer className="gap-0 justify-between bg-positive-500/10">
                                <DataLabel>
                                    Current OEE
                                    <Triangle className="w-3 ml-2" />
                                </DataLabel>
                                <DataValue className="text-4xl text-positive-700">
                                    {oee != null ? (
                                        <>
                                            {oee}
                                            <span className="inline-block ml-1 text-xl -translate-y-3 opacity-80">
                                                %
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-slate-300 font-light text-2xl">N/A</span>
                                    )}
                                </DataValue>
                            </DataContainer>
                            <DataContainer className="gap-0 justify-between">
                                <DataLabel className="flex items-center gap-2 text-positive-700 ">
                                    <Icon icon={faCheckToSlot} />
                                    {isLastProductionOrder ? "Last order" : "In production"}
                                </DataLabel>
                                <DataValue className="mt-1 text-slate-800">{orderNumber}</DataValue>
                                <p className="text-xs text-accent-500">{itemCode}</p>
                            </DataContainer>
                        </div>
                        {focusedOperation ? (
                            <DataContainer className="gap-2">
                                <div className="flex items-baseline justify-between gap-2">
                                    <DataLabel>{isLastOperation ? "Last operation" : "Current operation"}</DataLabel>
                                    <span className="text-xs tabular-nums text-muted">
                                        {focusedOperation.progressPercent}%
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-800 leading-tight">
                                        {focusedOperation.operationCode} {focusedOperation.id}
                                    </p>
                                    {focusedOperation.operationDescription && (
                                        <p className="text-xs text-subtle truncate">
                                            {focusedOperation.operationDescription}
                                        </p>
                                    )}
                                </div>
                                {/* Progress bar */}
                                <div className="h-1.5 rounded-full bg-slate-200/80 overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-500",
                                            focusedOperation.phase === "completed" ? "bg-slate-400" : "bg-emerald-500",
                                        )}
                                        style={{ width: `${focusedOperation.progressPercent}%` }}
                                    />
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted">
                                    <span>
                                        {focusedOperation.quantities.goodQuantity} /{" "}
                                        {focusedOperation.quantities.plannedQuantity} {focusedOperation.quantities.uom}
                                    </span>
                                    {focusedOperation.actualRunTimeMinutes != null && (
                                        <span>
                                            {fmtDuration(focusedOperation.actualRunTimeMinutes * 60)}
                                            {focusedOperation.plannedRunTimeMinutes != null && (
                                                <span className="text-muted/60">
                                                    {" "}
                                                    / {fmtDuration(focusedOperation.plannedRunTimeMinutes * 60)}
                                                </span>
                                            )}
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2">
                                    <DataContainer>
                                        <DataLabel>Quality</DataLabel>
                                        <DataValue className="text-2xl text-slate-800">
                                            {quality ? (
                                                <>
                                                    {quality}
                                                    <span className="inline-block ml-1 text-sm -translate-y-2 opacity-80">
                                                        %
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-slate-300 font-light">N/A</span>
                                            )}
                                        </DataValue>
                                    </DataContainer>
                                    <div className="grid grid-cols-2">
                                        <DataContainer className="rounded-e-none">
                                            <DataLabel className="text-positive-800">Valid</DataLabel>
                                            <DataValue className="text-2xl text-positive-800">{goodQuantity}</DataValue>
                                        </DataContainer>
                                        <DataContainer className="rounded-s-none -ml-px">
                                            <DataLabel className="text-negative-800">Rejected</DataLabel>
                                            <DataValue className="text-2xl text-negative-800">
                                                {scrapQuantity}
                                            </DataValue>
                                        </DataContainer>
                                    </div>
                                </div>
                            </DataContainer>
                        ) : (
                            <DataContainer>
                                <DataLabel>Current operation</DataLabel>
                                <p className="text-sm text-muted/50">No operation data</p>
                            </DataContainer>
                        )}
                        <Button
                            size="2xs"
                            variant="ghost"
                            className="flex w-fit justify-start gap-2"
                            onClick={() => setIsMESDashboardVisible(!isMESDashboardVisible)}
                        >
                            <Icon icon={faChartLine} />
                            MES Dashboard
                        </Button>
                    </div>
                </PanelWrapper>
            </ViewerPanel>
            {isMESDashboardVisible && (
                <div className="absolute top-1/2 left-1/2 z-10 w-90 h-full starting:opacity-0 starting:-translate-x-[80%] opacity-100 -translate-y-1/2 -translate-x-full transition-all duration-300 hover:scale-105 hover:-translate-z-[.25px]">
                    <iframe src={URL} className="w-full h-full" />
                </div>
            )}
        </BoundingBoxFaceProjection>
    );
}
