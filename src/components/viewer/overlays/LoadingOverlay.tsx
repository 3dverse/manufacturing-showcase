import { useContext } from "react";
import type { LivelinkConnectionStage } from "@3dverse/livelink";

//------------------------------------------------------------------------------
import { GhettoReconnectContext } from "@/contexts/GhettoReconnectContext";

//------------------------------------------------------------------------------
import { OverlayShroud } from "./_fragments/OverlayShroud";
import { ClientProductLogo } from "@/components/common/icons/ClientProductLogo";

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
        return <LoadingPanel stage={stage} />;
    }
};

//------------------------------------------------------------------------------
const stageMessages: Record<LivelinkConnectionStage, string> = {
    initializing: "Loading factory...",
    "finding-session": "Looking for available sessions...",
    "creating-session": "Creating new session...",
    "registering-client": "Registering client...",
    connecting: "Connecting to server...",
    configuring: "Loading all data sources...",
    ready: "Almost ready...",
};

//------------------------------------------------------------------------------
const LoadingPanel = ({ stage }: { stage: LivelinkConnectionStage }) => {
    //--------------------------------------------------------------------------
    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4">
            <ClientProductLogo isLoading className="w-12" />
            <p className="text-xs text-accent-500">{stageMessages[stage]}</p>
        </div>
    );
};
