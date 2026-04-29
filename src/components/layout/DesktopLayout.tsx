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
// import { IncidentRouteOverlay } from "@/components/incidents/IncidentRouteOverlay";

//------------------------------------------------------------------------------
import { FooterTabsContext, type FooterTab } from "@/contexts/FooterTabsContext";
import { FactoryContext } from "@/contexts/FactoryContext";

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

            <div className="absolute bottom-0 left-0 flex flex-col w-full h-full pointer-events-none z-50">
                <div className="flex flex-col md:flex-row items-start justify-between gap-2 md:p-2">
                    <div
                        className={cn(
                            "flex flex-col items-start gap-2 w-full max-w-96 2xl:max-w-120 transition-all duration-200",
                            isIncidentRoute && "-translate-x-full opacity-0",
                        )}
                    >
                        <MainHeader />
                        <div
                            data-scenario="incident-step-3"
                            className="hidden md:flex w-full justify-around pt-2 pb-1 px-2 bg-slate-0/90 backdrop-blur-sm border border-muted rounded overflow-hidden starting:-translate-y-3 -translate-y-1 starting:opacity-0 opacity-100 transition-all duration-200 delay-1000"
                        >
                            <KeyStatusIndicators keyStatus={data.keyStatus} />
                        </div>
                        <GlobalOrderPanel />
                    </div>
                    <Daytime />
                    <div className="w-full max-w-96 flex flex-col items-end gap-3">
                        <InvitePanel />
                    </div>
                </div>

                <div
                    className={cn(
                        "flex flex-col justify-end items-center grow p-2 md:p-3 transition-all duration-200",
                        isIncidentRoute && "translate-y-full opacity-0",
                    )}
                >
                    {nodeGraph && <Navigation className="col-span-2 md:col-span-1" />}
                </div>
                <FooterTabsContext.Provider value={{ footerTab, setFooterTab }}>
                    {footerTab === "timeline" ? <Timeline /> : <BOMPanel />}
                </FooterTabsContext.Provider>
            </div>

            {/* {isIncidentRoute && <IncidentRouteOverlay incidentId={incidentRoute.incidentId} />} */}
            <ScenarioStepper />
        </div>
    );
};
