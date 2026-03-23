//------------------------------------------------------------------------------
import { useCallback, useMemo } from "react";
import { faAngleLeft, faAngleRight } from "@fortawesome/pro-light-svg-icons";

//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { Icon } from "@/components/common/Icon";
import { ProgressBar } from "@/components/common/ProgressBar";
import { PanelLabel } from "@/components/common/panel/PanelLabel";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { Order } from "@/content/type";

//------------------------------------------------------------------------------
export const NavigationOrderPanel = ({ order, className }: { order: Order; className?: string }) => {
    return (
        <ViewerPanel
            as="article"
            className={cn("relative @container flex flex-col gap-4 w-full px-3 py-2 pointer-events-auto", className)}
        >
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
            <div className="flex justify-between items-start gap-16">
                <header className="flex flex-col items-start justify-between gap-2">
                    <div className="pt-px">
                        <PanelLabel className="text-xs">Current Order</PanelLabel>
                        <p className="mt-px -ml-px text-lg leading-tight font-semibold tabular-nums tracking-tight">
                            {order.ref}
                        </p>
                        <p className="text-2xs text-accent">Client {order.client}</p>
                    </div>
                    <div className="flex justify-between">
                        <p className="ml-px flex items-center gap-1 w-fit text-2xs text-muted rounded-sm bg-slate-50 hover:text-subtle hover:bg-slate-100 transition-colors duration-200 pl-px pr-2 py-px cursor-pointer">
                            <img src="/logo/sap.svg" alt="SAP" className="h-3" />
                            Updated 10s ago
                        </p>
                    </div>
                </header>

                <NavigationOrderPanelHeader order={order} className="hidden md:flex" />

                <div className="flex flex-col items-end pt-2 pr-1">
                    <div className="pt-1 text-2xl tabular-nums tracking-tighter leading-5 ">
                        <span className="text-accent font-normal">{order.unitsCompleted}</span> /{" "}
                        <span className="font-semibold">{order.unitsPlanned}</span>
                    </div>
                    <p className="text-2xs">Units</p>
                </div>
            </div>
            <NavigationOrderPanelHeader order={order} className="flex md:hidden" />
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
const NavigationOrderPanelHeader = ({ order, className }: { order: Order; className?: string }) => {
    //--------------------------------------------------------------------------
    const elapsedTime = useMemo(() => {
        const startDate = new Date(order.startDate);
        const endDate = new Date(order.endDate);
        const diffTime = endDate.getTime() - startDate.getTime();
        const diffHours = diffTime / (1000 * 60 * 60);
        const diffMinutes = (diffTime % (1000 * 60 * 60)) / (1000 * 60);
        return `${Math.floor(diffHours)}:${Math.floor(diffMinutes)}`;
    }, [order.startDate, order.endDate]);

    //--------------------------------------------------------------------------
    const formatDate = useCallback((date: Date) => {
        const now = new Date();
        const diffTime = now.getTime() - date.getTime();
        const diffHours = diffTime / (1000 * 60 * 60);
        const diffMinutes = (diffTime % (1000 * 60 * 60)) / (1000 * 60);
        return `${Math.floor(diffHours)}h${Math.floor(diffMinutes)}`;
    }, []);

    return (
        <div
            className={cn(
                "grow flex flex-col justify-center items-center self-center gap-2 w-full lg:max-w-md",
                className,
            )}
        >
            <div className="flex items-center gap-2">
                <p className="text-2xs text-muted/80">No delay</p>
                <p className="text-2xs text-muted/80">No incidents reported</p>
            </div>
            <ProgressBar
                progress={order.unitsCompleted / order.unitsPlanned}
                leftMarker={`Started today at ${formatDate(order.startDate)} `}
                rightMarker={`End today at ${formatDate(order.endDate)}`}
                elapsedTime={elapsedTime}
                className="w-full"
            />
        </div>
    );
};
