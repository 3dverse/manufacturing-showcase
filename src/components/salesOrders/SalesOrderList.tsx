//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";
import Tooltip from "@/components/common/Tooltip/Tooltip";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import { orders, orderStatus } from "@/content/orders";

//------------------------------------------------------------------------------
export const SalesOrderList = () => {
    return (
        <div>
            <div className="grid grid-cols-3 @sm:grid-cols-5 text-2xs text-muted px-2 pb-1">
                <p>Ref</p>
                <p className="hidden @sm:block">Planned Start</p>
                <p className="hidden @sm:block">Planned End</p>
                <p className="text-right">Units shipped</p>
                <p className="text-right">Status</p>
            </div>
            <ul className="bg-neutral-0/50 rounded divide-y divide-muted border border-muted">
                {orders.map((order) => (
                    <li key={order.ref}>
                        <Tooltip
                            content={
                                <p className="flex items-center text-2xs">
                                    Open <span className="tabular-nums ml-1">{order.ref}</span>
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
                                <p className="hidden @sm:block text-2xs pt-px text-subtle">
                                    {order.startDate.toLocaleTimeString()}
                                </p>
                                <p className="hidden @sm:block text-2xs pt-px text-subtle">
                                    {order.endDate.toLocaleTimeString()}
                                </p>
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
                    </li>
                ))}
            </ul>
        </div>
    );
};
