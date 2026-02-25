//------------------------------------------------------------------------------
import { faGrid } from "@fortawesome/pro-solid-svg-icons";

//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { Icon } from "@/components/common/Icon";

//------------------------------------------------------------------------------
import { useFactoryStore } from "@/store/useFactoryStore";
import { useNavigate } from "@/hooks/useNavigate";
import { cn } from "@/utils/cn";
import { useCallback, useContext } from "react";
import { SelectionContext } from "@/contexts/SelectionContext";
import { FactoryContext } from "@/contexts/FactoryContext";

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
    const headerClickHandler = useCallback(() => {
        if (nodeGraph) setSelectedNode(nodeGraph);
    }, [nodeGraph, setSelectedNode]);

    //--------------------------------------------------------------------------
    return (
        <ViewerPanel
            as="header"
            className={cn(
                "h-fit flex divide-x divide-muted/50 rounded-md border border-muted/50 shadow-[-10px_10px_100px_35px_#ffffff50] overflow-hidden pointer-events-auto",
                className,
            )}
        >
            <div className="flex items-start p-2">
                <button
                    className="p-1 aspect-square rounded-sm text-xs text-accent bg-accent-100/50 transition-colors duration-200 cursor-pointer"
                    onClick={homeClickHandler}
                >
                    <Icon icon={faGrid} size="lg" />
                </button>
            </div>

            <div className="flex flex-col justify-center divide-y divide-muted/50" onClick={headerClickHandler}>
                <div className="flex items-baseline gap-2 px-3 py-2">
                    <p className="text-base font-medium">{currentFactory?.name}</p>
                    <p className="text-xs text-muted">{currentFactory?.location}</p>
                </div>
            </div>
        </ViewerPanel>
    );
};

export default MainHeader;
