//------------------------------------------------------------------------------
import { useEffect } from "react";

//------------------------------------------------------------------------------
import { Viewer } from "@/components/viewer/Viewer";
import { MainHeader } from "@/components/layout/MainHeader";
import { Navigation } from "@/components/navigation/Navigation";
import { Timeline } from "@/components/timeline/Timeline";
import { NavigationOrderPanel } from "../orders/NavigationOrderPanel";
import { KeyStatusIndicators } from "../dashboard/header/StatusIndicators";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";
import { Router } from "@/core/Router";
import { dashboardApi } from "@/services/dashboardApi";

//------------------------------------------------------------------------------
import { orders } from "@/content/orders";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const FactoryLayout = ({ thumbnailMode, onBack }: { thumbnailMode?: boolean; onBack?: () => void }) => {
    //--------------------------------------------------------------------------
    // Context
    const data = dashboardApi.getDashboardData();

    //--------------------------------------------------------------------------
    // Effects
    useEffect(() => {
        Router.init();
    }, []);

    //--------------------------------------------------------------------------
    // Render
    return (
        <div className="relative flex-1 h-full w-full transition-all duration-200 overflow-hidden">
            <Viewer thumbnailMode={thumbnailMode} />
            <div
                className={cn(
                    "absolute bottom-0 left-0 flex flex-col w-full h-full pointer-events-none z-50 transition-all",
                    thumbnailMode ? "p-0" : "p-0",
                )}
            >
                <div className={thumbnailMode ? "" : "flex flex-col items-start w-96 2xl:w-120 p-2"}>
                    <MainHeader thumbnailMode={thumbnailMode} onBack={onBack} />
                    <KeyStatusIndicators keyStatus={data.keyStatus} />
                </div>

                {!thumbnailMode && (
                    <div className="flex flex-col justify-end items-center grow p-2 md:p-8">
                        <div className="grid grid-cols-[min-content_1fr] gap-1">
                            <Navigation />
                            <span className="hidden md:block" />
                            <NavigationOrderPanel order={orders[2]} className="col-span-2 md:col-span-1" />
                        </div>
                    </div>
                )}

                {!thumbnailMode && (
                    <div className="w-full self-end">
                        <Timeline className="appear-in-from-bottom opacity-0 [--animation-delay:1s]" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default FactoryLayout;
