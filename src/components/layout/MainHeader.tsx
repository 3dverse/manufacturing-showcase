//------------------------------------------------------------------------------
import { useCallback, useContext } from "react";
import { faGrid } from "@fortawesome/pro-solid-svg-icons";

//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { Icon } from "@/components/common/Icon";

//------------------------------------------------------------------------------
import { SelectionContext } from "@/contexts/SelectionContext";
import { FactoryContext } from "@/contexts/FactoryContext";
import { useFactoryStore } from "@/store/useFactoryStore";
import { useNavigate } from "@/hooks/useNavigate";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";
import OEEGauge from "../dashboard/OEE/OEEGauge";

//------------------------------------------------------------------------------
const MainHeader = ({ className }: { className?: string }) => {
    const { currentFactory } = useFactoryStore();
    const navigate = useNavigate();

    //--------------------------------------------------------------------------
    // Contexts
    const { setSelectedNode } = useContext(SelectionContext);
    const { nodeGraph } = useContext(FactoryContext);

    //--------------------------------------------------------------------------
    // Handlers
    const homeClickHandler = useCallback(() => {
        navigate("/");
    }, [navigate]);

    //--------------------------------------------------------------------------
    const factoryClickHandler = useCallback(() => {
        if (nodeGraph) setSelectedNode(nodeGraph);
    }, [nodeGraph, setSelectedNode]);

    // shadow-[-10px_10px_100px_35px_#ffffff50] overflow-hidden
    //--------------------------------------------------------------------------
    return (
        <header className={cn("flex h-fit pointer-events-auto", className)}>
            <ViewerPanel className="flex items-start p-2 rounded-none rounded-s-md border border-muted/50 z-10">
                <button
                    className="p-1 aspect-square rounded-sm text-xs text-accent bg-accent-100/30 hover:bg-accent-100/50 transition-colors duration-200 cursor-pointer"
                    onClick={homeClickHandler}
                >
                    <Icon icon={faGrid} size="lg" />
                </button>
            </ViewerPanel>

            <ViewerPanel className="flex items-start gap-x-4 rounded-none rounded-e-md border border-muted/50 border-l-0 opacity-0 appear-in-from-left [--animation-delay:1s]">
                <div className="flex flex-col justify-center divide-y divide-muted/50" onClick={factoryClickHandler}>
                    <div className="flex items-baseline gap-2 px-3 py-2">
                        <p className="text-base font-medium">{currentFactory?.name}</p>
                        <p className="text-xs text-muted">{currentFactory?.location}</p>
                    </div>
                </div>
                <div className="px-3 pt-2 pb-1">
                    {/* OEE
                    <span className="text-xl text-accent font-medium pl-2">
                        95<span className="text-xs font-bold">%</span>
                    </span> */}
                    <OEEGauge value={95} className="w-20!" />
                    <p className="text-2xs text-subtle tracking-wide text-center -translate-y-1">OEE</p>
                </div>
            </ViewerPanel>
        </header>
    );
};

export default MainHeader;
