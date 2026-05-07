//------------------------------------------------------------------------------
import { useCallback, useContext, useMemo, type MouseEvent } from "react";
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
import { useTimelineStore } from "@/store/useTimelineStore";
import { downtimeAtAsOf, workOrderAtAsOf } from "@/components/timeline/timeUtils";

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
    const span = useTimelineStore((s) => s.span);
    const asOf = useTimelineStore((s) => s.asOf);
    const present = useTimelineStore((s) => s.present);

    const hasStoppage = useMemo(() => {
        if (!span) return false;
        const t = asOf || present;
        return (
            [...span.downtimeEvents.values()].some((e) => downtimeAtAsOf(e, t)) ||
            [...span.eamWorkOrders.values()].some((wo) => workOrderAtAsOf(wo, t))
        );
    }, [span, asOf, present]);

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
                    <h2 className="font-semibold text-base">{factory?.name}</h2>
                    <div className="flex items-center gap-x-2 gap-y-2 text-xs text-accent-200">
                        <p className="text-[95%]">{factory?.location}</p>
                        <span>
                            <Icon icon={faClock} size="sm" /> 11:30
                        </span>
                    </div>
                </div>
                {oee !== null && (
                    <div className="relative m-1">
                        <BadgeOEE oee={oee} hasStoppage={hasStoppage} className="text-2xl px-2 py-1" />
                        <span className="absolute bottom-0.5 right-1 text-[10px] leading-none text-white/50">7d</span>
                    </div>
                )}
            </ViewerPanel>
        </header>
    );
};
