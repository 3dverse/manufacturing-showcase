//------------------------------------------------------------------------------
import { useMemo, useState } from "react";
import { faChartLine, faCheckToSlot } from "@fortawesome/sharp-regular-svg-icons";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";
import Button from "@/components/common/Button";
import { DataContainer, DataLabel, DataValue } from "@/components/common/panel/DataLabel";
import { Triangle } from "@/components/common/icons/Triangle";
import { MiniSparkline } from "@/components/common/metrics/MetricBlock";
import { useCellKpis } from "@/components/nodes/cells/useCellKpis";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";
import { fmtDuration } from "@/utils/helpers-time";

//------------------------------------------------------------------------------
import type { ProjectedOperation, ProjectedProductionOrder } from "@/core/Projection";
import type { MachineDetails } from "@/content/machine";
import type { CellNode } from "@/content/type";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const CellSummary = ({
    cell,
    operation,
    manufacturingOrder,
    machineDetails,
}: {
    cell: CellNode;
    operation?: ProjectedOperation;
    manufacturingOrder?: ProjectedProductionOrder;
    machineDetails: MachineDetails;
}) => {
    const { oeeHistory } = useCellKpis(cell);
    //--------------------------------------------------------------------------
    const [isMESDashboardVisible, setIsMESDashboardVisible] = useState(false);

    //--------------------------------------------------------------------------
    const { orderNumber, itemCode } = manufacturingOrder ?? { orderNumber: "", itemCode: "" };
    const { goodQuantity = 0, scrapQuantity = 0 } = operation?.quantities ?? {};

    //--------------------------------------------------------------------------
    const quality =
        goodQuantity + scrapQuantity > 0
            ? Number((goodQuantity / (goodQuantity + scrapQuantity)) * 100).toFixed(0)
            : undefined;

    //--------------------------------------------------------------------------
    const oee = useMemo(() => {
        if (!operation) return undefined;
        return Math.round((goodQuantity / (goodQuantity + scrapQuantity)) * 100);
    }, [operation, goodQuantity, scrapQuantity]);

    //--------------------------------------------------------------------------
    return (
        <>
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
                                    <span className="inline-block ml-1 text-xl -translate-y-3 opacity-80">%</span>
                                </>
                            ) : (
                                <span className="text-slate-300 font-light text-2xl">N/A</span>
                            )}
                        </DataValue>
                        <MiniSparkline
                            data={oeeHistory}
                            color="var(--color-positive-500)"
                            className="mt-1 opacity-70"
                        />
                    </DataContainer>
                    <DataContainer className="gap-0 justify-between">
                        <DataLabel className="flex items-center gap-2 text-positive-700 ">
                            <Icon icon={faCheckToSlot} />
                            {manufacturingOrder?.status === "completed" ? "Last order" : "In production"}
                        </DataLabel>
                        <DataValue className="mt-1 text-slate-800">{orderNumber}</DataValue>
                        <p className="text-xs text-accent-500">{itemCode}</p>
                    </DataContainer>
                </div>
                {operation ? (
                    <DataContainer className="gap-2">
                        <div className="flex items-baseline justify-between gap-2">
                            <DataLabel>
                                {operation.phase === "completed" ? "Last operation" : "Current operation"}
                            </DataLabel>
                            <span className="text-xs tabular-nums text-muted">{operation.progressPercent}%</span>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800 leading-tight">
                                {operation.operationCode} {operation.id}
                            </p>
                            {operation.operationDescription && (
                                <p className="text-xs text-subtle truncate">{operation.operationDescription}</p>
                            )}
                        </div>
                        {/* Progress bar */}
                        <div className="h-1.5 rounded-full bg-slate-200/80 overflow-hidden">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    operation.phase === "completed" ? "bg-slate-400" : "bg-emerald-500",
                                )}
                                style={{ width: `${operation.progressPercent}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted">
                            <span>
                                {operation.quantities.goodQuantity} / {operation.quantities.plannedQuantity}{" "}
                                {operation.quantities.uom}
                            </span>
                            {operation.actualRunTimeMinutes != null && (
                                <span>
                                    {fmtDuration(operation.actualRunTimeMinutes * 60)}
                                    {operation.plannedRunTimeMinutes != null && (
                                        <span className="text-muted/60">
                                            {" "}
                                            / {fmtDuration(operation.plannedRunTimeMinutes * 60)}
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
                                    <DataValue className="text-2xl text-negative-800">{scrapQuantity}</DataValue>
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
        </>
    );
};
