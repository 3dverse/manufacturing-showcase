//------------------------------------------------------------------------------
import { useCallback, useContext, type MouseEvent } from "react";
import { faGrid } from "@fortawesome/pro-solid-svg-icons";
import { faClock } from "@fortawesome/sharp-regular-svg-icons";

//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { Icon } from "@/components/common/Icon";
import { BadgeOEE } from "@/components/common/BadgeOEE";

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
                    className="p-1 aspect-square rounded-sm text-xs text-slate-0 bg-accent-100/10 group-hover:bg-accent-100/20 transition-colors duration-200 cursor-pointer"
                    href={"/"}
                    onClick={homeClickHandler}
                >
                    <Icon icon={faGrid} size="lg" />
                </a>
            </ViewerPanel>

            <ViewerPanel
                className={cn(
                    "basis-full flex justify-between items-start gap-x-4 rounded-none rounded-e-md shadow-[0_0_30px_-10px_var(--color-accent-800)] transition-all duration-200 border-0 text-slate-0 bg-accent-900",
                )}
            >
                <div className={cn("flex flex-col gap--1 justify-center px-3 py-2")} onClick={factoryClickHandler}>
                    <h2 className="font-semibold text-base group-hover:text-slate-100 transition-colors duration-200">
                        {factory?.name}
                    </h2>
                    <div className="flex items-center gap-x-2 gap-y-2 text-xs opacity-70">
                        <p className="text-[95%]">{factory?.location}</p>
                        <span>
                            <Icon icon={faClock} size="sm" /> 11:30
                        </span>
                    </div>
                </div>
                {oee !== null && <BadgeOEE oee={oee} className="text-xl m-1 px-3 py-2" />}
            </ViewerPanel>
        </header>
    );
};
