//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { FactoryOrderPanel } from "@/components/dashboard/order/FactoryOrderPanel";
import { PlanningPanel } from "@/components/dashboard/planning/PlanningPanel";

//------------------------------------------------------------------------------
import { orders } from "@/content/orders";

//------------------------------------------------------------------------------
export const FactoryPanel = () => {
    //--------------------------------------------------------------------------
    const SHOW_PLANNING_PANEL = false;

    //--------------------------------------------------------------------------
    return (
        <ViewerPanel
            as="article"
            className="w-full h-fit border border-accent-400 divide-y divide-slate-100 shadow-[0_36px_56px_-20px_var(--color-slate-200)] pointer-events-auto appear-in-from-left opacity-0 [--animation-delay:.75s]"
        >
            <article className="p-2">
                <FactoryOrderPanel order={orders[2]} />
            </article>

            {SHOW_PLANNING_PANEL && (
                <article className="p-2 pt-0">
                    <PlanningPanel />
                </article>
            )}
        </ViewerPanel>
    );
};
