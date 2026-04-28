//------------------------------------------------------------------------------
import { faListCheck } from "@fortawesome/sharp-solid-svg-icons";
import { faExclamationTriangle } from "@fortawesome/sharp-solid-svg-icons";
import { faChevronDown, faTimer } from "@fortawesome/pro-light-svg-icons";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import { orderStatus } from "@/content/orders";
import type { Order } from "@/content/type";

//------------------------------------------------------------------------------
type TimeBadgeProps = {
    order: Order;
    isPanelOpen?: boolean;
};

//------------------------------------------------------------------------------
export const TimeBadge = ({ order, isPanelOpen }: TimeBadgeProps) => {
    //--------------------------------------------------------------------------
    if ([orderStatus.completed.name, orderStatus.inProgress.name].includes(order.status.name)) {
        if (order.estimatedDelayInMin) {
            return (
                <Badge isPanelOpen={isPanelOpen} className="text-warning-700 bg-warning-100">
                    {order.status.name === orderStatus.inProgress.name && (
                        <BadgeIcon>
                            <Icon icon={faExclamationTriangle} size="sm" className="scale-110 pl-2" />
                        </BadgeIcon>
                    )}
                    <BadgeContent>{order.estimatedDelayInMin} min delay</BadgeContent>
                </Badge>
            );
        }
        return (
            <Badge isPanelOpen={isPanelOpen} className="text-positive-700 bg-positive-100">
                {order.status.name === orderStatus.inProgress.name && (
                    <BadgeIcon className="bg-positive-300/50">
                        <Icon icon={faTimer} size="xs" />
                    </BadgeIcon>
                )}
                <BadgeContent>On time</BadgeContent>
            </Badge>
        );
    }

    //--------------------------------------------------------------------------
    return (
        <Badge isPanelOpen={isPanelOpen} className="text-positive-700 bg-positive-100">
            <BadgeIcon>
                <Icon icon={faListCheck} size="xs" className="pl-4 pr-2" />
            </BadgeIcon>
            <BadgeContent>Ready</BadgeContent>
        </Badge>
    );
};

//------------------------------------------------------------------------------
const Badge = ({
    children,
    className,
    isPanelOpen,
}: {
    children: React.ReactNode;
    className?: string;
    isPanelOpen?: boolean;
}) => {
    return (
        <div className={cn("flex items-center rounded-full pr-2", className)}>
            {children}
            <Icon
                icon={faChevronDown}
                size="2xs"
                className={cn(
                    "self-center opacity-90 -translate-y-px transition-transform duration-300",
                    isPanelOpen && "rotate-180",
                )}
            />
        </div>
    );
};

//------------------------------------------------------------------------------
const BadgeIcon = ({ className, children }: { className?: string; children: React.ReactNode }) => {
    return (
        <div className={cn("flex items-center justify-center h-auto w-6 aspect-square rounded-full", className)}>
            {children}
        </div>
    );
};

//------------------------------------------------------------------------------
const BadgeContent = ({ children }: { children: React.ReactNode }) => {
    return <p className="pl-2 pr-2 py-1 font-medium text-xs">{children}</p>;
};
