//------------------------------------------------------------------------------
import Button from "@/components/common/Button";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";
import { timeAgo } from "@/utils/helpers-time";
import { useNavigationStore } from "@/store/useNavigationStore";
import { useTimelineStore } from "@/store/useTimelineStore";

//------------------------------------------------------------------------------
import type { HomeDowntimeEvent } from "@/hooks/useHomePageData";
import type { ProjectedWorkOrder } from "@/core/Projection";

//------------------------------------------------------------------------------
export type StoppageEvent = HomeDowntimeEvent | ProjectedWorkOrder;

//------------------------------------------------------------------------------
type CalloutStyle = {
    border: string;
    text: string;
    buttonClass: string;
};

const DOWNTIME_STYLE: CalloutStyle = {
    border: "border-warning-500/60",
    text: "text-warning-700",
    buttonClass: "bg-warning-600 hover:bg-warning-700 text-warning-50",
};

const WORK_ORDER_STYLE: CalloutStyle = {
    border: "border-amber-400/60",
    text: "text-amber-700",
    buttonClass: "bg-amber-400 hover:bg-amber-500 text-amber-950",
};

//------------------------------------------------------------------------------
function isWorkOrder(event: StoppageEvent): event is ProjectedWorkOrder {
    return "workOrderNumber" in event;
}

//------------------------------------------------------------------------------
function useNodeName(siteId: string, hash: string): string {
    const nodeList = useTimelineStore((s) => s.nodeListBySiteId.get(siteId));
    return nodeList?.find((n) => n.hash === hash)?.name ?? hash;
}

//------------------------------------------------------------------------------
function resolveRoute(event: StoppageEvent, factorySlug: string): string {
    if (isWorkOrder(event)) {
        return `/${factorySlug}/${event.assetId}/${event.id}`;
    }
    return `/${factorySlug}/${event.label}/${event.id}`;
}

//------------------------------------------------------------------------------
export const StoppageCallout = ({
    event,
    factorySlug,
    siteId,
    className,
}: {
    event: StoppageEvent;
    factorySlug: string;
    siteId: string;
    className?: string;
}) => {
    const navigate = useNavigationStore((state) => state.navigate);
    const nodeName = useNodeName(siteId, isWorkOrder(event) ? event.assetId : event.label);
    const style = isWorkOrder(event) ? WORK_ORDER_STYLE : DOWNTIME_STYLE;

    const { title, warning, actionLabel } = resolveContent(event, nodeName);

    const handleAction = (e: React.MouseEvent) => {
        e.preventDefault();
        navigate(resolveRoute(event, factorySlug));
    };

    return (
        <div
            data-scenario="corrective-maintenance-step-2"
            className={cn(
                "relative text-balance rounded-md border bg-slate-0/95 px-3 py-2 shadow-lg starting:opacity-0 starting:translate-y-2 opacity-100 translate-y-0 transition-all duration-400",
                style.border,
                className,
            )}
        >
            <p className="text-xs font-semibold text-muted">{title}</p>
            <p className={cn("mt-1 text-xs", style.text)}>{warning}</p>
            <div className="mt-2 flex items-center justify-end gap-1">
                <Button variant="plain" size="xs" onClick={handleAction} className={style.buttonClass}>
                    {actionLabel}
                </Button>
            </div>
        </div>
    );
};

//------------------------------------------------------------------------------
function resolveContent(
    event: StoppageEvent,
    nodeName: string,
): { title: string; warning: string; actionLabel: string } {
    if (isWorkOrder(event)) {
        const overdueTag = event.projected.isOverdue ? " — overdue" : "";
        const base = `Work order ${event.workOrderNumber}${overdueTag}`;
        if (event.workType === "preventive") {
            return { title: "Preventive maintenance", warning: base, actionLabel: "View work order" };
        }
        if (event.workType === "corrective") {
            return { title: "Corrective maintenance", warning: base, actionLabel: "View work order" };
        }
        return {
            title: "Work order",
            warning: `${event.workType.replace("_", " ")} — ${event.workOrderNumber}`,
            actionLabel: "View work order",
        };
    }

    if (event.reasonCode === "COOLANT_LEAK") {
        return {
            title: "Downtime detected",
            warning: `${event.details} maintenance ${timeAgo(new Date(event.startMs))}.`,
            actionLabel: "Go to the incident",
        };
    }

    if (event.type === "maintenance") {
        return { title: "Maintenance", warning: `${event.details} on ${nodeName}`, actionLabel: "View details" };
    }

    return { title: "Machine stop", warning: `${event.details} on ${nodeName}`, actionLabel: "Go to the incident" };
}
