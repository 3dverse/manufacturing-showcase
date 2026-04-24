//------------------------------------------------------------------------------
import { useEffect } from "react";

//------------------------------------------------------------------------------
import { Viewer } from "@/components/viewer/Viewer";
import { Navigation } from "@/components/navigation/Navigation";
import { InvitePanel } from "@/components/clients/InvitePanel";
import { MobileMainHeader } from "@/components/layout/MobileMainHeader";
import { SalesOrderCarousel } from "@/components/salesOrders/SalesOrderCarousel";

//------------------------------------------------------------------------------
import { Router } from "@/core/Router";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const MobileLayout = () => {
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
                <div className="flex flex-col justify-end items-end p-2 md:p-3">
                    <InvitePanel />
                </div>
                <span className="grow" />
                <SalesOrderCarousel />
                <MobileMainHeader>
                    <Navigation />
                </MobileMainHeader>
            </div>
        </div>
    );
};
