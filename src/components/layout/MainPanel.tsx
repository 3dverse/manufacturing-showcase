import { ViewerPanel } from "@/components/common/ViewerPanel";
import { WrapperPanel } from "@/components/common/panel/WrapperPanel";

//------------------------------------------------------------------------------
import { factory } from "@/content/factory";

//------------------------------------------------------------------------------
const MainPanel = () => {
    return (
        <ViewerPanel className="w-xs h-full pointer-events-auto">
            <WrapperPanel className="pl-10 py-4">
            <h1 className="text-lg font-semibold">{factory.name}</h1>
            <p className="mt-px text-xs text-subtle">{factory.description}</p>
            <p className="mt-1 text-2xs text-muted">{factory.location}</p>
            </WrapperPanel>
        </ViewerPanel>
    );
};

export default MainPanel;
