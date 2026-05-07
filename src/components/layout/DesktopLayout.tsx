//------------------------------------------------------------------------------
import { useContext, useEffect, useState } from "react";

//------------------------------------------------------------------------------
import { Daytime } from "@/components/common/Daytime";
import { Viewer } from "@/components/viewer/Viewer";
import { MainHeader } from "@/components/layout/MainHeader";
import { Navigation } from "@/components/navigation/Navigation";
import { Timeline } from "@/components/timeline/Timeline";
import { GlobalOrderPanel } from "@/components/manufacturingOrders/GlobalOrderPanel";
import { InvitePanel } from "@/components/clients/InvitePanel";
import { KeyStatusIndicators } from "@/components/nodes/factory/StatusIndicators";
import { BOMPanel } from "@/components/bom/BOMPanel";
import { ScenarioStepper } from "@/components/scenarios/ScenarioStepper";
import { ItemViewPanel } from "@/components/itemView/ItemViewPanel";
// import { IncidentRouteOverlay } from "@/components/incidents/IncidentRouteOverlay";

//------------------------------------------------------------------------------
import { FooterTabsContext, type FooterTab } from "@/contexts/FooterTabsContext";
import { FactoryContext } from "@/contexts/FactoryContext";
import { ScenarioContext } from "@/contexts/ScenariosContext";

//------------------------------------------------------------------------------
import { Router } from "@/core/Router";
import { dashboardApi } from "@/services/dashboardApi";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const DesktopLayout = () => {
    //--------------------------------------------------------------------------
    // Context
    const { nodeGraph } = useContext(FactoryContext);
    const { activeScenarioId } = useContext(ScenarioContext);

    //--------------------------------------------------------------------------
    const data = dashboardApi.getDashboardData();

    //--------------------------------------------------------------------------
    // State
    const [footerTab, setFooterTab] = useState<FooterTab>("timeline");

    // TODO: refactor incident route logic
    const isIncidentRoute = false;

    //--------------------------------------------------------------------------
    // Effects
    useEffect(() => {
        Router.init();
    }, []);

    //--------------------------------------------------------------------------
    // Render
    return (
        <div className="relative flex-1 h-full w-full overflow-hidden">
            <Viewer />
            {/* {isIncidentRoute && <IncidentRouteOverlay incidentId={incidentRoute.incidentId} />} */}
            <ScenarioStepper />

            <div className="absolute inset-0 flex flex-col w-full h-full max-h-full pointer-events-none z-50">
                <div data-viewport="full" className="relative min-h-0 flex flex-1 flex-row overflow-hidden">
                    {/* layer 1 */}
                    <div
                        id="layer-1"
                        className="absolute inset-0 w-full h-full max-h-full pointer-events-none z-50 flex flex-col md:p-2"
                    >
                        <div className="flex flex-col grow">
                            <div className="flex flex-row grow space-between">
                                <div
                                    className={cn(
                                        "flex flex-col items-start w-full max-w-96 2xl:max-w-100 transition-all duration-200",
                                        isIncidentRoute && "-translate-x-full opacity-0 pointer-events-none",
                                    )}
                                >
                                    <MainHeader />
                                    <div
                                        data-scenario="corrective-maintenance-step-3 predictive-maintenance-step-1 tour-guide-3"
                                        className="hidden md:flex w-full justify-around px-2 pt-3 pb-1 bg-accent-700 backdrop-blur-sm rounded-b overflow-hidden starting:-translate-y-3 -translate-y-2 starting:opacity-0 opacity-100 transition-all duration-200 delay-900 shadow-2xl -z-10"
                                    >
                                        <KeyStatusIndicators keyStatus={data.keyStatus} />
                                    </div>
                                    <GlobalOrderPanel />
                                </div>

                                <div className="grow flex flex-col items-end gap-3 pt-2 pr-2">
                                    <InvitePanel />
                                </div>
                            </div>

                            {!activeScenarioId && <Daytime />}

                            {nodeGraph && (
                                <div
                                    data-scenario="tour-guide-4"
                                    className={cn(
                                        "shrink-0 flex flex-col justify-end items-center p-2 md:p-3 transition-all duration-200",
                                        isIncidentRoute && "translate-y-full opacity-0 pointer-events-none",
                                    )}
                                >
                                    <Navigation className="col-span-2 md:col-span-1" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* layer 2 */}
                    <div
                        id="layer-2"
                        className="absolute inset-0 w-full h-full max-h-full pointer-events-none z-100 flex flex-row"
                    >
                        <div data-viewport="restrained" className="grow h-full"></div>
                        <ItemViewPanel />
                    </div>
                </div>

                <div className="shrink-0">
                    <FooterTabsContext.Provider value={{ footerTab, setFooterTab }}>
                        {footerTab === "timeline" ? <Timeline /> : <BOMPanel />}
                    </FooterTabsContext.Provider>
                </div>
            </div>
        </div>
    );
};
