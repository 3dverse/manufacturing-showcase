import { useContext } from "react";

//------------------------------------------------------------------------------
import { Livelink } from "@3dverse/livelink-react";
import { LoadingOverlay } from "@/components/viewer/overlays/LoadingOverlay";

//------------------------------------------------------------------------------
import { TOKEN_3DVERSE } from "@/content/3dverse";
import type { Factory } from "@/content/type";

//------------------------------------------------------------------------------
import { GhettoReconnectContextProvider } from "@/components/contextProviders/GhettoReconnectContextProvider";
import { LivelinkExfilContextProvider } from "@/components/contextProviders/LivelinkExfilContextProvider";
import { GhettoReconnectContext } from "@/contexts/GhettoReconnectContext";

//------------------------------------------------------------------------------
import { DisconnectedOverlay } from "@/components/viewer/overlays/DisconnectedOverlay";
import { FactoryProviders } from "@/components/layout/FactoryProviders";

//------------------------------------------------------------------------------
import FactoryLayout from "@/components/layout/FactoryLayout";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export default function FactoryPage({ factory }: { factory: Factory }) {
    //--------------------------------------------------------------------------
    // Render
    return (
        <GhettoReconnectContextProvider>
            <LivelinkExfilContextProvider>
                <PageContent factory={factory} />
            </LivelinkExfilContextProvider>
        </GhettoReconnectContextProvider>
    );
}

//------------------------------------------------------------------------------
function PageContent({ factory }: { factory: Factory }) {
    //--------------------------------------------------------------------------
    // Contexts
    const { reconnector } = useContext(GhettoReconnectContext);

    //--------------------------------------------------------------------------
    const params = new URLSearchParams(location.search);
    const sessionId = params.get("sessionId");

    //--------------------------------------------------------------------------
    // Render
    return sessionId ? (
        <Livelink
            sessionId={sessionId}
            token={TOKEN_3DVERSE}
            LoadingPanel={LoadingOverlay}
            ConnectionErrorPanel={DisconnectedOverlay}
        >
            <FactoryProviders factory={factory}>
                <FactoryLayout />
            </FactoryProviders>
        </Livelink>
    ) : (
        <Livelink
            sceneId={factory.scene_id}
            token={TOKEN_3DVERSE}
            isTransient={reconnector}
            LoadingPanel={LoadingOverlay}
            ConnectionErrorPanel={DisconnectedOverlay}
            autoJoinExisting={false}
        >
            <FactoryProviders factory={factory}>
                <FactoryLayout />
            </FactoryProviders>
        </Livelink>
    );
}
