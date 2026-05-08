//------------------------------------------------------------------------------
import { useCallback, useEffect } from "react";

//------------------------------------------------------------------------------
import { Viewer } from "@/components/viewer/Viewer";
import { Navigation } from "@/components/navigation/Navigation";
import { InvitePanel } from "@/components/clients/InvitePanel";
import { MobileMainHeader } from "@/components/layout/MobileMainHeader";
import { ManufacturingOrdersCarousel } from "@/components/manufacturingOrders/carousel/Carousel";
import { ClientProductLogo } from "@/components/common/icons/ClientProductLogo";

//------------------------------------------------------------------------------
import { Router } from "@/core/Router";
import { useNavigationStore } from "@/store/useNavigationStore";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const MobileLayout = () => {
    //--------------------------------------------------------------------------
    // Effects
    useEffect(() => {
        Router.init();
    }, []);

    const { navigate } = useNavigationStore();

    //--------------------------------------------------------------------------
    // Handlers
    const homeClickHandler = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            e.stopPropagation();
            navigate("/");
        },
        [navigate],
    );
    //--------------------------------------------------------------------------
    // Render
    return (
        <div className="relative flex-1 h-full w-full overflow-hidden">
            <Viewer />
            <div className="absolute bottom-0 left-0 flex flex-col w-full h-full pointer-events-none z-50">
                <div className="flex justify-between p-2 md:p-3">
                    <a
                        className="p-1 aspect-square rounded-sm text-xs text-slate-0 bg-accent-100/20 backdrop-blur-md pointer-events-auto cursor-pointer"
                        href="/"
                        onClick={homeClickHandler}
                    >
                        <ClientProductLogo />
                    </a>
                    <InvitePanel />
                </div>
                <span className="grow" data-viewport="standard" />
                <ManufacturingOrdersCarousel />
                <MobileMainHeader>
                    <Navigation />
                </MobileMainHeader>
            </div>
        </div>
    );
};
