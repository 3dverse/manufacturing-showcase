//------------------------------------------------------------------------------
import React from "react";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";
import { PanelHeader } from "@/components/common/panel/PanelHeader";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";
import { Card } from "@/components/common/Card";
import type { Order } from "@/content/type";

//------------------------------------------------------------------------------
interface OrderPanelProps {
    order: Order;
    className?: string;
}

//------------------------------------------------------------------------------
export const OrderPanel: React.FC<OrderPanelProps> = ({ order, className }) => {
    //--------------------------------------------------------------------------
    //--------------------------------------------------------------------------
    return (
        <div className={cn("@container flex flex-col gap-2", className)}>
            <header className="flex items-baseline gap-2 pr-2">
                <PanelHeader>Current Order</PanelHeader>
                <a href="#" className="text-2xs text-accent">
                    All orders
                </a>
            </header>
            <div>
                <Card>
                    <div className="flex items-center gap-2">
                        <p className="text-sm">{order.ref}</p>
                        <Icon icon={order.status.icon} className="text-xs" />
                    </div>
                </Card>
            </div>
        </div>
    );
};
