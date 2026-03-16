//------------------------------------------------------------------------------
import { useContext } from "react";

//------------------------------------------------------------------------------
import { Viewer } from "@/components/viewer/Viewer";
import { MainHeader } from "@/components/layout/MainHeader";
import { Navigation } from "@/components/navigation/Navigation";
import { FactoryPanel } from "@/components/nodes/factory/FactoryPanel";
import { GenericAreaPanel } from "@/components/nodes/areas/GenericAreaPanel";
import { LinePanel } from "@/components/nodes/lines/LinePanel";
import { CellPanel } from "@/components/nodes/cells/CellPanel";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import { SelectionContext } from "@/contexts/SelectionContext";

//------------------------------------------------------------------------------
import { NodeTypes } from "@/content/enums";

//------------------------------------------------------------------------------
const FactoryLayout = ({ thumbnailMode, onBack }: { thumbnailMode?: boolean; onBack?: () => void }) => {
    //--------------------------------------------------------------------------
    // Context
    const { selectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    // Render
    return (
        <div className="relative flex-1 h-full w-full transition-all duration-200">
            <Viewer thumbnailMode={thumbnailMode} />
            <div
                className={cn(
                    "absolute bottom-0 left-0 flex flex-col w-full h-full pointer-events-none z-50 transition-all",
                    thumbnailMode ? "p-0" : "p-2",
                )}
            >
                <div className={thumbnailMode ? "" : "flex flex-col items-start gap-1 w-96 2xl:w-120"}>
                    <MainHeader thumbnailMode={thumbnailMode} onBack={onBack} />
                    {!thumbnailMode && <FactoryPanel />}
                    {!thumbnailMode && selectedNode?.type === NodeTypes.area && (
                        <GenericAreaPanel area={selectedNode} />
                    )}
                    {!thumbnailMode && selectedNode?.type === NodeTypes.line && <LinePanel line={selectedNode} />}
                    {!thumbnailMode && selectedNode?.type === NodeTypes.cell && <CellPanel cell={selectedNode} />}
                </div>

                {!thumbnailMode && (
                    <div className="flex items-end justify-center grow pb-8">
                        <Navigation />
                    </div>
                )}
            </div>
        </div>
    );
};

export default FactoryLayout;
