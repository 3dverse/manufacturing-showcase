//------------------------------------------------------------------------------
import { useCallback, useContext, type MouseEvent } from "react";
import { faGrid } from "@fortawesome/pro-solid-svg-icons";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";
import { BadgeOEE } from "@/components/common/BadgeOEE";

//------------------------------------------------------------------------------
import { FactoryContext } from "@/contexts/FactoryContext";
import { SelectionContext } from "@/contexts/SelectionContext";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";
import { useFactoryOEE } from "@/hooks/useFactoryOEE";

//------------------------------------------------------------------------------
export const MobileMainHeader = ({
    onBack,
    className,
    children,
}: {
    onBack?: () => void;
    className?: string;
    children?: React.ReactNode;
}) => {
    //--------------------------------------------------------------------------
    // Contexts
    const { setSelectedNode } = useContext(SelectionContext);
    const { nodeGraph, factory } = useContext(FactoryContext);
    const oee = useFactoryOEE();

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
    return (
        <div className="flex flex-col text-slate-50 bg-slate-900 pointer-events-auto">
            <header className={cn("flex gap-3 w-full h-fit", className)}>
                <a
                    className="flex items-center justify-center aspect-square text-xs text-slate-0 bg-accent-100/10 group-hover:bg-accent-100/20 transition-colors duration-200 cursor-pointer"
                    href="/"
                    onClick={homeClickHandler}
                >
                    <Icon icon={faGrid} size="lg" />
                </a>
                <div className="grow flex flex-wrap items-center" onClick={factoryClickHandler}>
                    <div className="flex items-baseline flex-wrap gap-x-2">
                        <h2
                            className={cn(
                                "font-medium text-base group-hover:text-slate-100 transition-colors duration-200",
                            )}
                        >
                            {factory?.name}
                        </h2>
                        <p className="text-2xs opacity-70">{factory?.location}</p>
                    </div>
                </div>
                {oee !== null && <BadgeOEE oee={oee} className="text-lg px-2 py-1 m-1" />}
            </header>
            {children}
        </div>
    );
};
