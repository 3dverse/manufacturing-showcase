//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { ProductionAreaSummary } from "@/components/nodes/areas/production/ProductionAreaSummary";
import { SalesOrderPlanning } from "@/components/salesOrders/SalesOrderPlanning";

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
                <ProductionAreaSummary />
            </article>

            {SHOW_PLANNING_PANEL && (
                <article className="p-2 pt-0">
                    <SalesOrderPlanning />
                </article>
            )}
        </ViewerPanel>
    );
};
