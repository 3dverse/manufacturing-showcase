//------------------------------------------------------------------------------
import { useContext } from "react";

//------------------------------------------------------------------------------
import { Viewer } from "@/components/viewer/Viewer";
import { MainHeader } from "@/components/layout/MainHeader";
import { MainNav } from "@/components/layout/MainNav";
import { FactoryPanel } from "@/components/nodes/factory/FactoryPanel";
import { GenericAreaPanel } from "@/components/nodes/areas/GenericAreaPanel";
import { LinePanel } from "@/components/nodes/lines/LinePanel";
import { CellPanel } from "@/components/nodes/cells/CellPanel";

//------------------------------------------------------------------------------
import { SelectionContext } from "@/contexts/SelectionContext";

//------------------------------------------------------------------------------
import { NodeTypes } from "@/content/enums";

//------------------------------------------------------------------------------
const FactoryLayout = ({ currentRoute }: { currentRoute: string }) => {
    //--------------------------------------------------------------------------
    console.log("FactoryLayout", currentRoute);
    const { selectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    return (
        <div className="relative flex-1">
            <Viewer />
            <div className="absolute bottom-0 left-0 flex flex-col w-full h-full p-2 pointer-events-none z-50">
                <div className="flex flex-col items-start gap-1 w-96 2xl:w-120">
                    <MainHeader />
                    <FactoryPanel />
                    {selectedNode?.type === NodeTypes.area && <GenericAreaPanel area={selectedNode} />}
                    {selectedNode?.type === NodeTypes.line && <LinePanel line={selectedNode} />}
                    {selectedNode?.type === NodeTypes.cell && <CellPanel cell={selectedNode} />}
                </div>

                <div className="flex items-end justify-center grow pb-8">
                    <MainNav />
                </div>
            </div>
        </div>
    );
};

export default FactoryLayout;
