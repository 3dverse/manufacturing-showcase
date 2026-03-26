//------------------------------------------------------------------------------
import { useEffect } from "react";

//------------------------------------------------------------------------------
import { Viewer } from "@/components/viewer/Viewer";
import { MainHeader } from "@/components/layout/MainHeader";
import { Navigation } from "@/components/navigation/Navigation";
import { Timeline } from "@/components/timeline/Timeline";
import { GlobalOrderPanel } from "../orders/GlobalOrderPanel";
import { KeyStatusIndicators } from "../dashboard/header/StatusIndicators";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";
import { Router } from "@/core/Router";
import { dashboardApi } from "@/services/dashboardApi";

//------------------------------------------------------------------------------

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
                <div className="flex flex-col md:flex-row justify-between gap-2 p-2">
                    <div className={thumbnailMode ? "" : "flex flex-col items-start w-full max-w-96 2xl:max-w-120"}>
                        <MainHeader thumbnailMode={thumbnailMode} onBack={onBack} />
                        <KeyStatusIndicators keyStatus={data.keyStatus} />
                    </div>

                    {!thumbnailMode && <GlobalOrderPanel className="max-w-96" />}
                </div>

                {!thumbnailMode && (
                    <div className="flex flex-col justify-end items-center grow p-2 md:p-3">
                        <Navigation className="col-span-2 md:col-span-1" />
                    </div>
                )}

                {!thumbnailMode && (
                    <div className="w-full self-end">
                        <Timeline className="h-full min-h-40 appear-in-from-bottom opacity-0 [--animation-delay:1s]" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default FactoryLayout;
