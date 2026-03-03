//------------------------------------------------------------------------------
import { useCallback, useContext } from "react";
import { faGrid } from "@fortawesome/pro-solid-svg-icons";
import { faClock } from "@fortawesome/sharp-regular-svg-icons";

//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { Icon } from "@/components/common/Icon";
import { Gauge } from "@/components/common/metrics/Gauge";

//------------------------------------------------------------------------------
import { SelectionContext } from "@/contexts/SelectionContext";
import { FactoryContext } from "@/contexts/FactoryContext";
import { useFactoryStore } from "@/store/useFactoryStore";
import { useNavigate } from "@/hooks/useNavigate";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export const MainHeader = ({ className }: { className?: string }) => {
    //--------------------------------------------------------------------------
    // Contexts
    const { currentFactory } = useFactoryStore();
    const navigate = useNavigate();
    const { setSelectedNode } = useContext(SelectionContext);
    const { nodeGraph } = useContext(FactoryContext);

    //--------------------------------------------------------------------------
    // Handlers
    const homeClickHandler = useCallback(() => {
        navigate("/");
    }, [navigate]);

    const factoryClickHandler = useCallback(() => {
        if (nodeGraph) setSelectedNode(nodeGraph);
    }, [nodeGraph, setSelectedNode]);

    //--------------------------------------------------------------------------
    return (
        <header className={cn("flex w-full h-fit pointer-events-auto", className)}>
            <ViewerPanel className="flex items-start p-2 bg-accent-600/90 shadow-none rounded-none rounded-s-md border border-accent-600 z-10">
                <button
                    className="p-1 aspect-square rounded-sm text-xs text-slate-0 bg-accent-100/10 hover:bg-accent-100/20 transition-colors duration-200 cursor-pointer"
                    onClick={homeClickHandler}
                >
                    <Icon icon={faGrid} size="lg" />
                </button>
            </ViewerPanel>

            <ViewerPanel className="basis-full flex justify-between items-start gap-x-4 bg-accent-600/90 text-slate-0 rounded-none rounded-e-md border border-accent-600 border-l-0 opacity-0 appear-in-from-left [--animation-delay:1s]">
                <div className="flex flex-col justify-center divide-y divide-muted/50" onClick={factoryClickHandler}>
                    <div className="flex flex-col gap--1 px-3 py-2">
                        <p className="text-base font-medium">{currentFactory?.name}</p>
                        <div className="flex items-baseline gap-x-2 text-xs opacity-70">
                            <p className="text-[95%]">{currentFactory?.location}</p>
                            <p className="text-2xs">
                                <Icon icon={faClock} size="sm" />
                                <span className="pl-1 tabular-nums">11:30</span>
                            </p>
                        </div>
                    </div>
                </div>
                <div className="px-3 pt-2 pb-1 bg-slate-0/90 rounded-e-[5px]">
                    <Gauge value={95} className="w-20!" />
                    <p className="text-2xs text-subtle tracking-wide text-center -translate-y-1">OEE</p>
                </div>
            </ViewerPanel>
        </header>
    );
};
