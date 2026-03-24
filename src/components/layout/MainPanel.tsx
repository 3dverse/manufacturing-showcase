//------------------------------------------------------------------------------
import { ViewerPanelResizable } from "@/components/common/ViewerPanelResizable";
import { LiveDashboard } from "@/components/dashboard";

//------------------------------------------------------------------------------
const MainPanel = () => {
    return (
        <ViewerPanelResizable
            resizableFrom="right"
            defaultWidth={400}
            minWidth={400}
            maxWidth={800}
            className="h-full pointer-events-auto"
        >
            <LiveDashboard />
        </ViewerPanelResizable>
    );
};

export default MainPanel;
