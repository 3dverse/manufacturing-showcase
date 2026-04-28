//------------------------------------------------------------------------------
import { useCallback, useContext } from "react";

//------------------------------------------------------------------------------
import { BadgeOEE } from "@/components/common/BadgeOEE";

//------------------------------------------------------------------------------
import { FactoryContext } from "@/contexts/FactoryContext";
import { SelectionContext } from "@/contexts/SelectionContext";

//------------------------------------------------------------------------------
import { useFactoryOEE } from "@/hooks/useFactoryOEE";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export const MobileMainHeader = ({ className, children }: { className?: string; children?: React.ReactNode }) => {
    //--------------------------------------------------------------------------
    // Contexts
    const { setSelectedNode } = useContext(SelectionContext);
    const { nodeGraph, factory } = useContext(FactoryContext);
    const oee = useFactoryOEE();

    //--------------------------------------------------------------------------
    // Handlers
    const factoryClickHandler = useCallback(() => {
        if (nodeGraph) setSelectedNode(nodeGraph);
    }, [nodeGraph, setSelectedNode]);

    //--------------------------------------------------------------------------
    return (
        <div className="flex flex-col text-slate-50 bg-slate-900 pointer-events-auto">
            <header className={cn("flex gap-3 w-full h-fit", className)}>
                <div className="grow flex flex-wrap items-center pl-4" onClick={factoryClickHandler}>
                    <div className="flex items-baseline flex-wrap gap-x-2">
                        <h2
                            className={cn(
                                "font-semibold text-base group-hover:text-slate-100 transition-colors duration-200",
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
