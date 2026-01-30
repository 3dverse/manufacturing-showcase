import { ViewerPanelResizable } from "@/components/common/ViewerPanelResizable";
import { LiveDashboard } from "@/components/dashboard";

//------------------------------------------------------------------------------
import { factory } from "@/content/factory";

//------------------------------------------------------------------------------
const MainPanel = () => {
    return (
        <ViewerPanelResizable
            resizableFrom="right"
            defaultWidth={600}
            minWidth={400}
            maxWidth={800}
            className="h-full pointer-events-auto"
        >
            <LiveDashboard factory={factory} />
        </ViewerPanelResizable>
    );
};

export default MainPanel;
