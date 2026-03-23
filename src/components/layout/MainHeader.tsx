//------------------------------------------------------------------------------
import { useCallback, useContext, useMemo, type MouseEvent } from "react";
import { faGrid } from "@fortawesome/pro-solid-svg-icons";
import { faClock } from "@fortawesome/sharp-regular-svg-icons";

//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { Icon } from "@/components/common/Icon";
import { BadgeOEE } from "@/components/common/BadgeOEE";

//------------------------------------------------------------------------------
import { SelectionContext } from "@/contexts/SelectionContext";
import { FactoryContext } from "@/contexts/FactoryContext";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export const MainHeader = ({
    thumbnailMode,
    onBack,
    className,
}: {
    thumbnailMode?: boolean;
    onBack?: () => void;
    className?: string;
}) => {
    //--------------------------------------------------------------------------
    // Contexts
    const { setSelectedNode } = useContext(SelectionContext);
    const { nodeGraph, factory } = useContext(FactoryContext);

    //--------------------------------------------------------------------------
    // Handlers
    const homeClickHandler = useCallback(
        (e: MouseEvent) => {
            if (onBack) {
                e.preventDefault();
                e.stopPropagation();
                onBack();
            }
        },
        [onBack],
    );

    //--------------------------------------------------------------------------
    const factoryClickHandler = useCallback(() => {
        if (nodeGraph) setSelectedNode(nodeGraph);
    }, [nodeGraph, setSelectedNode]);

    //--------------------------------------------------------------------------
    const panelStateClassName = useMemo(() => {
        return thumbnailMode
            ? "text-base bg-slate-50 group-hover:bg-accent-600 group-hover:text-slate-0"
            : "text-slate-0 bg-accent-600";
    }, [thumbnailMode]);

    //--------------------------------------------------------------------------
    const subpanelStateClassName = useMemo(() => {
        return thumbnailMode ? "pl-7 pr-5 pt-5 pb-4" : "px-3 py-2";
    }, [thumbnailMode]);

    //--------------------------------------------------------------------------
    const h2StateClassName = useMemo(() => {
        return thumbnailMode ? "text-3xl" : "";
    }, [thumbnailMode]);

    //--------------------------------------------------------------------------
    const widgetStateClassName = useMemo(() => {
        return thumbnailMode
            ? "border-b border-b-slate-100 group-hover:border-b-accent-600"
            : "border border-accent-600 rounded-e-[5px]";
    }, [thumbnailMode]);

    //--------------------------------------------------------------------------
    return (
        <header className={cn("flex w-full h-fit pointer-events-auto", className)}>
            {!thumbnailMode && (
                <ViewerPanel
                    className={cn(
                        "flex items-start p-2 shadow-none rounded-none rounded-s-md border-0 border-r border-slate-100 z-10 transition-all duration-200",
                        panelStateClassName,
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
            )}

            <ViewerPanel
                className={cn(
                    "basis-full flex justify-between items-start gap-x-4 rounded-none rounded-e-md shadow-[0_0_30px_-10px_var(--color-accent-800)] transition-all duration-200 border-0",
                    panelStateClassName,
                )}
            >
                <div
                    className={cn("flex flex-col gap--1 justify-center", subpanelStateClassName)}
                    onClick={factoryClickHandler}
                >
                    <h2
                        className={cn(
                            "font-semibold text-base group-hover:text-slate-100 transition-colors duration-200",
                            h2StateClassName,
                        )}
                    >
                        {factory?.name}
                    </h2>
                    <div className="flex items-center gap-x-2 gap-y-2 text-xs opacity-70">
                        <p className="text-[95%]">{factory?.location}</p>
                        <span>
                            <Icon icon={faClock} size="sm" /> 11:30
                        </span>
                    </div>
                </div>

                <div className={cn("flex bg-slate-0/90 h-full", widgetStateClassName)}>
                    <BadgeOEE oee={95} className="text-3xl px-4 py-2" />
                </div>
            </ViewerPanel>
        </header>
    );
};
