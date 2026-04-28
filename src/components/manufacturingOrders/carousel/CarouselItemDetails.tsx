//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { Order } from "@/content/type";

//------------------------------------------------------------------------------
type ManufacturingOrderDetailsPanelProps = {
    order: Order;
    isLoading: boolean;
};

//------------------------------------------------------------------------------
export const ManufacturingOrderDetailsPanel = ({ order, isLoading }: ManufacturingOrderDetailsPanelProps) => {
    //--------------------------------------------------------------------------
    const progressPrct = order.unitsPlanned > 0 ? Math.round((order.unitsCompleted / order.unitsPlanned) * 100) : 0;
    const startTime = order.startDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    const endTime = order.endDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    const details = order.details ?? {
        delivery: `${order.client} delivery window from ${startTime} to ${endTime}.`,
        machine: "Machine allocation pending in the production scheduler.",
        incident: order.description ?? "No active incident reported by the digital twin.",
        digitalTwin: `${progressPrct}% completion projected from live order telemetry.`,
        action: "Keep monitoring the live twin before dispatch confirmation.",
    };
    const detailRows = [{ label: "Time delivery", value: details.delivery }];

    //--------------------------------------------------------------------------
    return (
        <div className="h-24 overflow-hidden">
            {isLoading ? (
                <p className="flex items-center justify-center h-full pb-5 text-xs text-slate-600">Loading...</p>
            ) : (
                <>
                    <div className="grid gap-3 md:grid-cols-2">
                        {detailRows.map((detail) => (
                            <div key={detail.label}>
                                <p className="text-2xs font-semibold uppercase tracking-wide text-slate-700/60">
                                    {detail.label}
                                </p>
                                <p
                                    className={cn(
                                        "mt-1 text-sm leading-snug text-slate-600",
                                        order.estimatedDelayInMin ? "text-warning-700" : "text-slate-600",
                                    )}
                                >
                                    {detail.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
