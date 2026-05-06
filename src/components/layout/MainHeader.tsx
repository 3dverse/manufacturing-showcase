//------------------------------------------------------------------------------
import { useCallback, useContext, type MouseEvent } from "react";
import { faAngleLeft } from "@fortawesome/pro-light-svg-icons";
import { faClock } from "@fortawesome/sharp-regular-svg-icons";

//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { Icon } from "@/components/common/Icon";
import { BadgeOEE } from "@/components/common/BadgeOEE";
import { ClientProductLogo } from "../common/icons/ClientProductLogo";

//------------------------------------------------------------------------------
import { useNavigationStore } from "@/store/useNavigationStore";
import { useFactoryOEE } from "@/hooks/useFactoryOEE";

//------------------------------------------------------------------------------
import { SelectionContext } from "@/contexts/SelectionContext";
import { FactoryContext } from "@/contexts/FactoryContext";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export const MainHeader = ({ className }: { className?: string }) => {
    //--------------------------------------------------------------------------
    // Contexts
    const { setSelectedNode } = useContext(SelectionContext);
    const { nodeGraph, factory } = useContext(FactoryContext);

    //--------------------------------------------------------------------------
    // Hooks
    const oee = useFactoryOEE();
    const { navigate } = useNavigationStore();

    //--------------------------------------------------------------------------
    // Handlers
    const homeClickHandler = useCallback(
        (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            navigate("/");
        },
        [navigate],
    );

    //--------------------------------------------------------------------------
    const factoryClickHandler = useCallback(() => {
        if (nodeGraph) setSelectedNode(nodeGraph);
    }, [nodeGraph, setSelectedNode]);

    //--------------------------------------------------------------------------
    return (
        <header className={cn("flex w-full h-fit pointer-events-auto", className)}>
            <ViewerPanel
                className={cn(
                    "flex items-start p-2 shadow-none rounded-none rounded-s-md border-0 border-r border-slate-100/20 z-10 transition-all duration-200 text-slate-0 bg-accent-900",
                )}
            >
                <a
                    className="group p-1 aspect-square rounded-sm text-xs text-slate-0 bg-accent/60 group-hover:bg-accent-100/20 transition-colors duration-200 overflow-hidden cursor-pointer"
                    href="/"
                    onClick={homeClickHandler}
                >
                    <Icon
                        icon={faAngleLeft}
                        size="lg"
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 scale-75 group-hover:translate-x-3 group-hover:scale-100 transition-transform duration-200"
                    />
                    <ClientProductLogo className="group-hover:translate-x-5 group-hover:scale-90 transition-transform duration-200" />
                </a>
            </ViewerPanel>

            <ViewerPanel
                className={cn(
                    "basis-full flex justify-between items-start gap-x-4 rounded-none rounded-e-md shadow-[0_0_30px_-10px_var(--color-accent-800)] transition-all duration-200 border-0 text-slate-0 bg-accent-900",
                )}
            >
                <div className={cn("flex flex-col gap--1 justify-center px-3 py-2")} onClick={factoryClickHandler}>
                    <h2 className="font-semibold text-base">
                        {factory?.name}
                    </h2>
                    <div className="flex items-center gap-x-2 gap-y-2 text-xs text-accent-200">
                        <p className="text-[95%]">{factory?.location}</p>
                        <span>
                            <Icon icon={faClock} size="sm" /> 11:30
                        </span>
                    </div>
                </div>
                {oee !== null && <BadgeOEE oee={oee} className="text-2xl m-1 px-2 py-1" />}
            </ViewerPanel>
        </header>
    );
};
