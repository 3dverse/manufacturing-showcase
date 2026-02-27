//------------------------------------------------------------------------------
import React from "react";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";
import { PanelLabel } from "@/components/common/panel";
import { Card } from "@/components/common/Card";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { Order } from "@/content/type";

//------------------------------------------------------------------------------
interface OrderPanelProps {
    order: Order;
    className?: string;
}

//------------------------------------------------------------------------------
export const OrderPanel: React.FC<OrderPanelProps> = ({ order, className }) => {
    //--------------------------------------------------------------------------
    return (
        <div className={cn("@container flex flex-col gap-2", className)}>
            <header className="px-1">
                <PanelLabel className="text-xs text-default">Current Order</PanelLabel>
            </header>
            <Card className="text-slate-0 bg-accent hover:bg-accent-600 border-accent cursor-pointer transition-colors duration-200">
                <div className="flex items-center justify-between gap-2 px-2 py-1">
                    <p className="text-sm tabular-nums tracking-wide">{order.ref}</p>
                    <Icon icon={order.status.icon} className="text-xs text-slate-0" />
                </div>
            </Card>
        </div>
    );
};
