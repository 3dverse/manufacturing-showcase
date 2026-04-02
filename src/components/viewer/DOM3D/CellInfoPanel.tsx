//------------------------------------------------------------------------------
import { useMemo, useState } from "react";
import { BoundingBoxFaceProjection } from "@3dverse/livelink-react-ui";
import { faChartLine, faCheckToSlot, faFilePdf } from "@fortawesome/sharp-regular-svg-icons";
import { faExclamationTriangle } from "@fortawesome/sharp-solid-svg-icons";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";
import { Icon } from "@/components/common/Icon";
import Button from "@/components/common/Button";
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { PanelTitle, PanelWrapper } from "@/components/common/panel";
import { DataContainer, DataLabel, DataValue } from "@/components/common/panel/DataLabel";
import { Triangle } from "@/components/common/icons/Triangle";

//------------------------------------------------------------------------------
import { getMachineDocumentation } from "@/content/machine";

//------------------------------------------------------------------------------
import { useSpanProjection } from "@/hooks/useSpanProjection";
import { useCorrelation } from "@/hooks/useCorrelation";
import { fmtDuration } from "@/components/timeline/timeUtils";
import type { CellNode } from "@/content/type";
const reportFile = "/assets/interventionReport.pptx";

//------------------------------------------------------------------------------
const URL = "https://explorer-test.productys.com/?zoom_level=20&dashboard_id=168";

//------------------------------------------------------------------------------
export function CellInfoPanel({ cell }: { cell: CellNode }) {
    //--------------------------------------------------------------------------
    const [isMESDashboardVisible, setIsMESDashboardVisible] = useState(false);

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

    console.log("fo", focusedOperation);

    // Step 2: build a correlated set from the focused operation.
    const focused = useMemo(
        () => (focusedOperation ? { type: "operation" as const, id: focusedOperation.id } : null),
        [focusedOperation],
    );
    const correlated = useCorrelation(projection, focused);
    console.log("corr", correlated);

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
    const hasIncident = useMemo(() => {
        if (!projection || !correlated || correlated.downtimeEvents.size === 0) return false;
        return projection.downtimeEvents.filter((d) => correlated.downtimeEvents.has(d.id)).some((d) => d.isOngoing);
    }, [projection, correlated]);

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
    console.log("OP", focusedOperation);
    console.log("FO2");
    if (!productionOrder) return null;
    return (
        <BoundingBoxFaceProjection
            entity={cell.entity}
            face="right"
            className="flex flex-col justify-end gap-3 transform-3d pointer-events-none"
        >
            {hasIncident && (
                <>
                    <ViewerPanel className="transform-[translateZ(-.1px)] relative min-w-80 bg-warning-500 shadow-[0_-4px_56px_-1px_var(--color-warning-500)] [corner-shape:bevel] starting:opacity-0 starting:translate-y-8 opacity-100 translate-y-0 translate-x-[80%] transition-all duration-400 delay-500">
                        <PanelWrapper className="py-2">
                            <PanelTitle className="capitalize text-warning-100 text-sm">
                                <Icon icon={faExclamationTriangle} className="mr-2 text-sm text-warning-100" />
                                Incident reported
                            </PanelTitle>
                            <a target="_blank" href={reportFile} rel="noopener noreferrer" style={{ display: "block" }}>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="button mt-2 w-full border-warning-400 text-warning-100 hover:bg-warning-400 hover:text-warning-100"
                                >
                                    <Icon icon={faFilePdf} className="mr-2 text-sm text-warning-100" />
                                    Read the report
                                </Button>
                            </a>
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
