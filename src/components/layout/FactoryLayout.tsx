//------------------------------------------------------------------------------
import { useEffect, useState } from "react";

//------------------------------------------------------------------------------
import { Viewer } from "@/components/viewer/Viewer";
import { MainHeader } from "@/components/layout/MainHeader";
import { Navigation } from "@/components/navigation/Navigation";
import { Timeline } from "@/components/timeline/Timeline";
import { GlobalOrderPanel } from "@/components/orders/GlobalOrderPanel";
import { InvitePanel } from "@/components/clients/InvitePanel";
import { KeyStatusIndicators } from "@/components/dashboard/header/StatusIndicators";
import { BOMPanel } from "@/components/bom/BOMPanel";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";
import { Router } from "@/core/Router";
import { dashboardApi } from "@/services/dashboardApi";
import { FooterTabsContext, type FooterTab } from "@/contexts/FooterTabsContext";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

const FactoryLayout = ({ thumbnailMode, onBack }: { thumbnailMode?: boolean; onBack?: () => void }) => {
    //--------------------------------------------------------------------------
    // Context
    const data = dashboardApi.getDashboardData();
    const [footerTab, setFooterTab] = useState<FooterTab>("timeline");

    //--------------------------------------------------------------------------
    // Map workCenterId (hash) → CellNode for direct BOM-to-cell linking

    //--------------------------------------------------------------------------
    // Effects
    useEffect(() => {
        Router.init();
    }, []);

    //--------------------------------------------------------------------------
    // Render
    return (
        <div className="relative flex-1 h-full w-full overflow-hidden">
            <Viewer thumbnailMode={thumbnailMode} />
            <div
                className={cn(
                    "absolute bottom-0 left-0 flex flex-col w-full h-full pointer-events-none z-50",
                    thumbnailMode ? "p-0" : "p-0",
                )}
            >
                <div className="flex flex-col md:flex-row justify-between gap-2 p-2">
                    <div className={thumbnailMode ? "" : "flex flex-col items-start w-full max-w-96 2xl:max-w-120"}>
                        <MainHeader thumbnailMode={thumbnailMode} onBack={onBack} />
                        <KeyStatusIndicators keyStatus={data.keyStatus} />
                        <GlobalOrderPanel />
                    </div>
                    <div className="w-full max-w-96 flex flex-col items-end gap-3">
                        <InvitePanel />
                    </div>
                </div>

                {!thumbnailMode && (
                    <div className="flex flex-col justify-end items-center grow p-2 md:p-3">
                        <Navigation className="col-span-2 md:col-span-1" />
                    </div>
                )}

                {!thumbnailMode && (
                    <div className="w-full self-end">
                        <FooterTabsContext.Provider value={{ footerTab, setFooterTab }}>
                            {footerTab === "timeline" ? (
                                <Timeline className="h-full min-h-40" />
                            ) : (
                                <BOMPanel className="border-t border-slate-200/15 bg-slate-0/80 backdrop-blur-xl" />
                            )}
                        </FooterTabsContext.Provider>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FactoryLayout;
