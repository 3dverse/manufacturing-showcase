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
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-100/50 border-t-accent-500 outline-8 outline-accent-100/30" />
            </OverlayShroud>
        );
    } else {
        return <OriginalLoadingOverlay stage={stage} />;
    }
};
