//------------------------------------------------------------------------------
import { useCallback, useContext } from "react";
import { faAngleLeft, faAngleRight } from "@fortawesome/pro-light-svg-icons";

//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { Icon } from "@/components/common/Icon";
import { ProgressBar } from "@/components/common/ProgressBar";
import { PanelLabel } from "@/components/common/panel/PanelLabel";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";
import { SelectionContext } from "@/contexts/SelectionContext";
import { useScope } from "@/hooks/useScope";
import { useSnapshot } from "@/hooks/useSnapshot";
import { useProjection } from "@/hooks/useProjection";
import { useTimelineStore } from "@/store/useTimelineStore";
import type { ProjectedProductionOrder, ProjectedOperation, Phase } from "@/core/Projection";

//------------------------------------------------------------------------------
const PHASE_LABEL: Record<Phase, string> = {
    completed: "Completed",
    active: "In progress",
    future: "Scheduled",
};

//------------------------------------------------------------------------------
export const GlobalOrderPanel = ({ className }: { className?: string }) => {
    //--------------------------------------------------------------------------
    const { selectedNode } = useContext(SelectionContext);
    const { scope } = useScope(selectedNode ?? null);
    const { snapshot } = useSnapshot(scope);
    const projection = useProjection(snapshot);

    //--------------------------------------------------------------------------
    const asOf = useTimelineStore((s) => s.asOf);
    const order = projection?.productionOrders[0] ?? null;
    const operation =
        projection?.operations.find((o) => o.id === snapshot?.productionOrders[0]?.currentOperationId) ?? null;

    const SHOW_PREV_NEXT_BUTTONS = false;

    //--------------------------------------------------------------------------
    if (!order) return null;
    return (
        <ViewerPanel
            as="article"
            className={cn("relative @container w-full flex flex-col gap-2 px-3 py-2 pointer-events-auto", className)}
        >
            {SHOW_PREV_NEXT_BUTTONS && (
                <>
                    <PrevNextOrderButton
                        orderName="PO 123457"
                        isPrev={true}
                        className="absolute top-1/2 -translate-y-1/2 -left-[2px] -translate-x-full"
                    />
                    <PrevNextOrderButton
                        orderName="PO 123459"
                        isPrev={false}
                        className="absolute top-1/2 -translate-y-1/2 -right-[2px] translate-x-full"
                    />
                </>
            )}
            <div className="flex justify-between items-start gap-16">
                <header className="flex flex-col items-start justify-between gap-2">
                    <div className="pt-px">
                        <PanelLabel className="text-xs">Current Order</PanelLabel>
                        <p className="mt-px -ml-px text-lg leading-tight font-semibold tabular-nums tracking-tight">
                            {order.orderNumber}
                        </p>
                        <p className="text-2xs text-accent">{order.itemCode}</p>
                    </div>
                    <div className="flex justify-between">
                        <p className="ml-px flex items-center gap-1 w-fit text-2xs text-muted rounded-sm bg-slate-50 hover:text-subtle hover:bg-slate-100 transition-colors duration-200 pl-px pr-2 py-px cursor-pointer">
                            <img src="/logo/sap.svg" alt="SAP" className="h-3" />
                            Updated 8s ago
                        </p>
                    </div>
                </header>
                <div className="flex flex-col items-end pt-2 pr-1">
                    <div className="pt-1 text-2xl tabular-nums tracking-tighter leading-5">
                        <span className="text-accent font-normal">{order.quantities.producedQuantity}</span>
                        {" / "}
                        <span className="font-semibold">{order.quantities.plannedQuantity}</span>
                    </div>
                    <p className="text-2xs">{order.quantities.uom}</p>
                    <div className="mt-2">
                        <span
                            className={cn(
                                "text-2xs px-1.5 py-px rounded-full",
                                order.phase === "active" && "bg-accent-100 text-accent",
                                order.phase === "completed" && "bg-slate-100 text-muted",
                                order.phase === "future" && "bg-slate-50 text-subtle",
                            )}
                        >
                            {PHASE_LABEL[order.phase]}
                        </span>
                    </div>
                </div>
            </div>
            <GlobalOrderPanelHeader order={order} operation={operation} className="pb-4" asOf={asOf} />
        </ViewerPanel>
    );
};

//------------------------------------------------------------------------------
const PrevNextOrderButton = ({
    orderName,
    isPrev = true,
    className,
}: {
    orderName: string;
    isPrev?: boolean;
    className?: string;
}) => {
    return (
        <button
            className={cn(
                "flex items-center justify-center h-[70%] p-1 text-muted bg-slate-100/70 border border-slate-0/50 backdrop-blur-xl cursor-pointer hover:text-default hover:bg-slate-100 transition-all duration-200",
                isPrev ? "rounded-s-lg rounded-e-none flex-row-reverse" : "rounded-s-none rounded-e-lg",
                className,
            )}
        >
            <p className="text-2xs leading-tight tracking-wider [writing-mode:vertical-rl]">{orderName}</p>
            <Icon icon={isPrev ? faAngleLeft : faAngleRight} size="xs" />
        </button>
    );
};

//------------------------------------------------------------------------------
const GlobalOrderPanelHeader = ({
    order,
    operation,
    className,
    asOf,
}: {
    order: ProjectedProductionOrder;
    operation: ProjectedOperation | null;
    className?: string;
    asOf: number;
}) => {
    const startSecs = order.timing.actualStart ?? order.timing.scheduledStart;
    const endSecs = order.timing.actualEnd ?? order.timing.scheduledEnd;

    const formatSecs = useCallback(
        (secs: number) => {
            const diffSecs = Math.abs(asOf - secs);
            const h = Math.floor(diffSecs / 3600);
            const m = Math.floor((diffSecs % 3600) / 60);
            return `${h}h${String(m).padStart(2, "0")}`;
        },
        [asOf],
    );

    const opLabel = operation
        ? `${operation.operationDescription ?? operation.operationCode} — step ${operation.sequence}`
        : null;

    return (
        <div className={cn("grow flex flex-col self-center gap-2 w-full lg:max-w-md", className)}>
            <div className="flex items-start gap-2">
                {opLabel && <p className="text-2xs text-muted/80">{opLabel}</p>}
            </div>
            <ProgressBar
                progress={order.estimatedProgress / 100}
                leftMarker={`Started ${formatSecs(startSecs)} ago`}
                rightMarker={`Ends in ${formatSecs(endSecs)}`}
                elapsedTime={`${order.progressPercent}%`}
                className="w-full"
            />
        </div>
    );
};
