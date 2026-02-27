//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { PanelTitle, PanelWrapper } from "@/components/common/panel";
import { OrderPanel } from "@/components/dashboard/order/OrderPanel";
import { PlanningPanel } from "@/components/dashboard/planning/PlanningPanel";

//------------------------------------------------------------------------------
import { orders } from "@/content/orders";
import type { AreaNode } from "@/content/type";

//------------------------------------------------------------------------------
export function AreaProductionPanel({ area }: { area: AreaNode }) {
    //--------------------------------------------------------------------------
    return (
        <ViewerPanel
            as="article"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-80 h-fit divide-y divide-slate-100 pointer-events-auto z-10 appear-in-from-right opacity-0 [--animation-delay:.75s]"
        >
            <PanelWrapper className="py-2 px-3">
                <PanelTitle className="mb-0 text-sm">{area.name} AREA</PanelTitle>
            </PanelWrapper>

            <article className="px-2 mb-3 py-3">
                <OrderPanel order={orders[2]} />
            </article>

            <article className="p-2 pt-0">
                <PlanningPanel />
            </article>
        </ViewerPanel>
    );
}
