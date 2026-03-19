//------------------------------------------------------------------------------
import { useContext, useEffect } from "react";

//------------------------------------------------------------------------------
import { Viewer } from "@/components/viewer/Viewer";
import { MainHeader } from "@/components/layout/MainHeader";
import { Navigation } from "@/components/navigation/Navigation";
import { FactoryTimeline } from "@/components/nodes/factory/FactoryTimeline";
import { FactoryPanel } from "@/components/nodes/factory/FactoryPanel";
import { AreaPanel } from "@/components/nodes/areas/AreaPanel";
import { LinePanel } from "@/components/nodes/lines/LinePanel";

//------------------------------------------------------------------------------
import { isArea, isLine } from "@/core/NavGraph";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import { SelectionContext } from "@/contexts/SelectionContext";
import { Router } from "@/core/Router";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const FactoryLayout = ({ thumbnailMode, onBack }: { thumbnailMode?: boolean; onBack?: () => void }) => {
    //--------------------------------------------------------------------------
    // Context
    const { selectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    // Effects
    useEffect(() => {
        Router.init();
    }, []);

    //--------------------------------------------------------------------------
    // Render
    return (
        <div className="relative flex-1 h-full w-full transition-all duration-200">
            <Viewer thumbnailMode={thumbnailMode} />
            <div
                className={cn(
                    "absolute bottom-0 left-0 flex flex-col w-full h-full pointer-events-none z-50 transition-all",
                    thumbnailMode ? "p-0" : "p-0",
                )}
            >
                <div className={thumbnailMode ? "" : "flex flex-col items-start gap-1 w-96 2xl:w-120 p-2"}>
                    <MainHeader thumbnailMode={thumbnailMode} onBack={onBack} />
                    {!thumbnailMode && <FactoryPanel />}
                    {!thumbnailMode && selectedNode && isArea(selectedNode) && <AreaPanel area={selectedNode} />}
                    {!thumbnailMode && selectedNode && isLine(selectedNode) && <LinePanel line={selectedNode} />}
                    {/* {!thumbnailMode && selectedNode && isCell(selectedNode) && <CellPanel cell={selectedNode} />} */}
                </div>

                {!thumbnailMode && (
                    <div className="flex items-end justify-center grow pb-8">
                        <Navigation />
                    </div>
                )}

                {!thumbnailMode && (
                    <div className="w-full self-end">
                        <FactoryTimeline className="appear-in-from-bottom opacity-0 [--animation-delay:1s]" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default FactoryLayout;
