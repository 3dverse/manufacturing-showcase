import { useContext } from "react";
import { LoadingOverlay as OriginalLoadingOverlay } from "@3dverse/livelink-react-ui";
import type { LivelinkConnectionStage } from "@3dverse/livelink";

//------------------------------------------------------------------------------
import { GhettoReconnectContext } from "@/contexts/GhettoReconnectContext";

//------------------------------------------------------------------------------
import { OverlayShroud } from "./_fragments/OverlayShroud";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const LoadingOverlay = ({ stage }: { stage: LivelinkConnectionStage }) => {
    //--------------------------------------------------------------------------
    // Contexts
    const { reconnecting, backdropUrl } = useContext(GhettoReconnectContext);

    //--------------------------------------------------------------------------
    // Render
    if (reconnecting) {
        return (
            <OverlayShroud backdropUrl={backdropUrl}>
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-accent-500" />
            </OverlayShroud>
        );
    } else {
        return <OriginalLoadingOverlay stage={stage} />;
    }
};
