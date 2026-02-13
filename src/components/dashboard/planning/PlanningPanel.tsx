//------------------------------------------------------------------------------
import React, { useState } from "react";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";
import Tooltip from "@/components/common/Tooltip/Tooltip";
import { PanelHeader } from "@/components/common/panel/PanelHeader";

//------------------------------------------------------------------------------
import { orders, orderStatus } from "@/content/orders";
import type { DailyProduction } from "@/services/dashboardApi";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
interface PlanningPanelProps {
    className?: string;
    dailyProductionData: DailyProduction[];
}

//------------------------------------------------------------------------------
export const PlanningPanel: React.FC<PlanningPanelProps> = ({ dailyProductionData }) => {
    //--------------------------------------------------------------------------
    const [todayTotalUnitsCompleted, setTodayTotalUnitsCompleted] = useState(0);
    const [showPing, setShowPing] = useState(false);

    //--------------------------------------------------------------------------
    const highlightProgressOrder = (newTodayTotalUnitsCompleted: number) => {
        if (newTodayTotalUnitsCompleted !== todayTotalUnitsCompleted) {
            setShowPing(true);
            setTimeout(() => {
                setShowPing(false);
            }, 650);
            setTodayTotalUnitsCompleted(newTodayTotalUnitsCompleted);
        }
    };

    //--------------------------------------------------------------------------
    // Compute the today total units completed and the edited orders
    const todayProduction = dailyProductionData[dailyProductionData.length - 1];
    const _todayTotalUnitsCompleted = todayProduction?.qualityProducts || 0;
    const editedOrders = orders.map((order) => {
        if (order.status.name === orderStatus.inProgress.name) {
            // Each time unitedCompleted changed, set a state showPing and reset it after 1 second
            highlightProgressOrder(_todayTotalUnitsCompleted);

            return {
                ...order,
                unitsCompleted: todayTotalUnitsCompleted,
            };
        }
        return order;
    });

    //--------------------------------------------------------------------------
    return (
        <div className="@container flex flex-col gap-2">
            <header className="flex items-baseline gap-2 pr-2">
                <PanelHeader>Planning</PanelHeader>
                <a href="#" className="text-2xs text-accent">
                    All orders
                </a>
            </header>

            <div>
                <div className="grid grid-cols-3 @sm:grid-cols-5 text-2xs text-muted pr-2 pl-1 pb-1">
                    <p>Ref</p>
                    <p className="hidden @sm:block">Planned Start</p>
                    <p className="hidden @sm:block">Planned End</p>
                    <p className="text-right">Units</p>
                    <p className="text-right">Status</p>
                </div>
                <ul className="bg-neutral-0/50 rounded divide-y divide-muted border border-muted">
                    {editedOrders.map((order) => (
                        <li key={order.ref}>
                            <Tooltip
                                content={
                                    <p className="flex items-center text-2xs">
                                        Open order <span className="tabular-nums ml-1">{order.ref}</span>
                                        <img src="/logo/sap.svg" alt="SAP" className="h-3 ml-2" />
                                    </p>
                                }
                                showArrow={false}
                                offset={0}
                                containerClassName="block w-full"
                            >
                                <div
                                    className={cn(
                                        "group relative grid grid-cols-3 @sm:grid-cols-5 text-xs pl-2 py-1 hover:bg-underground transition-all duration-200 cursor-pointer",
                                        order.status.name === orderStatus.planned.name
                                            ? "opacity-60 hover:opacity-100"
                                            : "",
                                        order.status.name === orderStatus.inProgress.name
                                            ? "bg-accent-50/50 hover:bg-accent-50"
                                            : "",
                                    )}
                                >
                                    {order.status.name === orderStatus.inProgress.name && showPing && <Swoosh />}
                                    <p
                                        className={cn(
                                            "tabular-nums",
                                            order.status.name === orderStatus.inProgress.name
                                                ? "text-accent font-medium"
                                                : "",
                                        )}
                                    >
                                        {order.ref}
                                    </p>
                                    <p className="hidden @sm:block text-2xs pt-px text-subtle">{order.startDate}</p>
                                    <p className="hidden @sm:block text-2xs pt-px text-subtle">{order.endDate}</p>
                                    <p className="tabular-nums tracking-tight text-right">
                                        <span
                                            className={cn(
                                                "",
                                                order.unitsCompleted === 0 ? "text-muted/80" : "",
                                                order.unitsCompleted !== 0 &&
                                                    (order.unitsPlanned > order.unitsCompleted
                                                        ? "text-accent-700 font-semibold"
                                                        : "text-positive-800 font-medium"),
                                            )}
                                        >
                                            {order.unitsCompleted}
                                        </span>
                                        <span className="pl-[2px] pr-px text-muted/80">/</span>
                                        {order.unitsPlanned}
                                    </p>
                                    <p
                                        className={cn(
                                            "flex justify-self-end items-center gap-1 w-fit mr-1",
                                            order.status.color,
                                        )}
                                    >
                                        {order.status.name}
                                        <Icon icon={order.status.icon} size="xs" fixedWidth />
                                    </p>
                                </div>
                            </Tooltip>
                            {order.status.name === orderStatus.inProgress.name && (
                                <div className="px-2 pt-1 pb-2 grid grid-cols-5 bg-accent text-accent-50">
                                    <span />
                                    <p className="text-2xs">
                                        {/* <Icon
                                                icon={faClipboardClock}
                                                size="sm"
                                                fixedWidth
                                                className=" inline mr-1"
                                            /> */}
                                        No delay
                                    </p>
                                    <p className="text-2xs">Estimated completion: {order.endDate}</p>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

//------------------------------------------------------------------------------
const Swoosh = () => {
    return (
        <span
            className="absolute inset-0 opacity-30 pointer-events-none
            bg-[linear-gradient(90deg,transparent_25%,var(--color-accent)_50%,transparent_75%)]
            bg-size-[200%_100%]
            animate-[bg-swoosh_.6s_ease-in-out_forwards]"
        />
    );
};
