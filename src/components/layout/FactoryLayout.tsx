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
import { MobileMainHeader } from "@/components/layout/MobileMainHeader";
import { SalesOrderCarousel } from "@/components/salesOrders/SalesOrderCarousel";

//------------------------------------------------------------------------------
import { FooterTabsContext, type FooterTab } from "@/contexts/FooterTabsContext";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";
import { useMediaQuery, MEDIA_QUERIES } from "@/utils/useMediaQuery";
import { Router } from "@/core/Router";
import { dashboardApi } from "@/services/dashboardApi";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const FactoryLayout = ({ thumbnailMode, onBack }: { thumbnailMode?: boolean; onBack?: () => void }) => {
    //--------------------------------------------------------------------------
    // Context
    const data = dashboardApi.getDashboardData();
    const [footerTab, setFooterTab] = useState<FooterTab>("timeline");
    const isMobile = useMediaQuery(MEDIA_QUERIES.MOBILE);

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
            <div className="absolute bottom-0 left-0 flex flex-col w-full h-full pointer-events-none z-50">
                {isMobile ? (
                    <>
                        <div className="flex flex-col justify-end items-end p-2 md:p-3">
                            <InvitePanel />
                        </div>
                        <span className="grow" />
                        <SalesOrderCarousel />
                        <MobileMainHeader onBack={onBack}>
                            <Navigation />
                        </MobileMainHeader>
                    </>
                ) : (
                    <>
                        <div className="flex flex-col md:flex-row justify-between gap-2 md:p-2">
                            <div
                                className={
                                    thumbnailMode ? "" : "flex flex-col items-start gap-2 w-full max-w-96 2xl:max-w-120"
                                }
                            >
                                <MainHeader thumbnailMode={thumbnailMode} onBack={onBack} />
                                <div
                                    className={cn(
                                        "hidden md:flex w-full justify-around pt-2 pb-1 px-2 bg-slate-0/90 backdrop-blur-sm border border-muted rounded overflow-hidden",
                                        "starting:-translate-y-3 -translate-y-1 starting:opacity-0 opacity-100 transition-all duration-200 delay-1000",
                                    )}
                                >
                                    <KeyStatusIndicators keyStatus={data.keyStatus} />
                                </div>
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
                    </>
                )}
            </div>
        </div>
    );
};

export default FactoryLayout;
